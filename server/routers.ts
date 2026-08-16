import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { sdk } from "./_core/sdk";
import { verifyPassword, hashPassword, localOpenIdForEmail } from "./auth";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Run seed on router load
db.seedInitialData().catch(err => console.error("[Seed] Failed:", err));

const tenantProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  const tenantId = ctx.user.tenantId || 1;
  return next({
    ctx: {
      ...ctx,
      tenantId,
      user: ctx.user,
    },
  });
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8),
      }))
      .mutation(async ({ ctx, input }) => {
        const email = input.email.trim().toLowerCase();
        const user = await db.getUserByEmail(email);
        if (!user || !verifyPassword(input.password, user.passwordHash)) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password." });
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || email,
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        const { passwordHash: _passwordHash, ...safeUser } = user;
        return safeUser;
      }),
    register: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(8),
        companyName: z.string().min(2),
        kraPin: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const email = input.email.trim().toLowerCase();
        if (await db.getUserByEmail(email)) {
          throw new TRPCError({ code: "CONFLICT", message: "An account with this email already exists." });
        }
        const tenantId = Number(await db.createTenant({
          companyName: input.companyName,
          kraPin: input.kraPin || null,
          email,
          phone: null,
          address: null,
          subdomain: null,
          status: "Active",
        }));
        const database = await db.getDb();
        if (!database) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database is not available." });
        const { users } = await import("../drizzle/schema");
        await database.insert(users).values({
          openId: localOpenIdForEmail(email),
          name: input.name.trim(),
          email,
          passwordHash: hashPassword(input.password),
          loginMethod: "password",
          tenantId,
          role: "Company Admin",
          lastSignedIn: new Date(),
        });
        const created = await db.getUserByEmail(email);
        if (!created) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Account could not be created." });
        const sessionToken = await sdk.createSessionToken(created.openId, {
          name: created.name || email,
          expiresInMs: ONE_YEAR_MS,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
        await db.createAuditLog({
          tenantId,
          userId: created.id,
          userName: created.name || email,
          action: "CREATE",
          entityType: "Tenant",
          entityId: tenantId,
          details: `Registered company ${input.companyName} with a Company Admin account.`,
        });
        const { passwordHash: _passwordHash, ...safeUser } = created;
        return safeUser;
      }),
    me: publicProcedure.query(opts => {
      if (!opts.ctx.user) return null;
      const { passwordHash: _passwordHash, ...safeUser } = opts.ctx.user;
      return safeUser;
    }),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    updateRole: protectedProcedure
      .input(z.object({ role: z.enum(["Super Admin", "Company Admin", "HR Manager", "Payroll Manager", "Employee"]) }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "Super Admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only Super Admin can change roles." });
        }
        const database = await db.getDb();
        if (database) {
          const { users } = await import("../drizzle/schema");
          const { eq } = await import("drizzle-orm");
          await database.update(users).set({ role: input.role }).where(eq(users.id, ctx.user.id));
        }
        return { success: true };
      }),
  }),

  tenant: router({
    get: tenantProcedure.query(async ({ ctx }) => {
      return await db.getTenantById(ctx.tenantId);
    }),
    list: tenantProcedure.query(async ({ ctx }) => {
      if (ctx.user.role !== "Super Admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await db.getTenants();
    }),
    create: tenantProcedure
      .input(z.object({
        companyName: z.string().min(2),
        kraPin: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        subdomain: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "Super Admin" && ctx.user.role !== "Company Admin") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only Admins can register companies." });
        }
        const tenantId = await db.createTenant({
          companyName: input.companyName,
          kraPin: input.kraPin || null,
          email: input.email || null,
          phone: input.phone || null,
          address: input.address || null,
          subdomain: input.subdomain || null,
          status: "Active",
        });
        await db.createAuditLog({
          tenantId: Number(tenantId),
          userId: ctx.user.id,
          userName: ctx.user.name || "User",
          action: "CREATE",
          entityType: "Tenant",
          entityId: Number(tenantId),
          details: `Registered company ${input.companyName}`,
        });
        return { success: true, tenantId };
      }),
  }),

  org: router({
    branches: tenantProcedure.query(async ({ ctx }) => {
      return await db.getBranches(ctx.tenantId);
    }),
    createBranch: tenantProcedure
      .input(z.object({ name: z.string(), code: z.string().optional(), location: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!["Super Admin", "Company Admin", "HR Manager"].includes(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const id = await db.createBranch({ tenantId: ctx.tenantId, ...input });
        await db.createAuditLog({
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          userName: ctx.user.name || "User",
          action: "CREATE",
          entityType: "Branch",
          entityId: Number(id),
          details: `Created branch ${input.name}`,
        });
        return { success: true, id };
      }),

    departments: tenantProcedure.query(async ({ ctx }) => {
      return await db.getDepartments(ctx.tenantId);
    }),
    createDepartment: tenantProcedure
      .input(z.object({ name: z.string(), code: z.string().optional(), branchId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!["Super Admin", "Company Admin", "HR Manager"].includes(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const id = await db.createDepartment({ tenantId: ctx.tenantId, ...input });
        await db.createAuditLog({
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          userName: ctx.user.name || "User",
          action: "CREATE",
          entityType: "Department",
          entityId: Number(id),
          details: `Created department ${input.name}`,
        });
        return { success: true, id };
      }),

    designations: tenantProcedure.query(async ({ ctx }) => {
      return await db.getDesignations(ctx.tenantId);
    }),
    createDesignation: tenantProcedure
      .input(z.object({ name: z.string(), description: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!["Super Admin", "Company Admin", "HR Manager"].includes(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const id = await db.createDesignation({ tenantId: ctx.tenantId, ...input });
        await db.createAuditLog({
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          userName: ctx.user.name || "User",
          action: "CREATE",
          entityType: "Designation",
          entityId: Number(id),
          details: `Created designation ${input.name}`,
        });
        return { success: true, id };
      }),

    grades: tenantProcedure.query(async ({ ctx }) => {
      return await db.getGrades(ctx.tenantId);
    }),
    createGrade: tenantProcedure
      .input(z.object({ name: z.string(), level: z.string().optional(), minSalary: z.string().optional(), maxSalary: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!["Super Admin", "Company Admin", "HR Manager"].includes(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const id = await db.createGrade({
          tenantId: ctx.tenantId,
          name: input.name,
          level: input.level || null,
          minSalary: input.minSalary ? input.minSalary : null,
          maxSalary: input.maxSalary ? input.maxSalary : null,
        });
        await db.createAuditLog({
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          userName: ctx.user.name || "User",
          action: "CREATE",
          entityType: "Grade",
          entityId: Number(id),
          details: `Created grade ${input.name}`,
        });
        return { success: true, id };
      }),

    employmentTypes: tenantProcedure.query(async ({ ctx }) => {
      return await db.getEmploymentTypes(ctx.tenantId);
    }),
    createEmploymentType: tenantProcedure
      .input(z.object({ name: z.string(), description: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (!["Super Admin", "Company Admin", "HR Manager"].includes(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const id = await db.createEmploymentType({ tenantId: ctx.tenantId, ...input });
        await db.createAuditLog({
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          userName: ctx.user.name || "User",
          action: "CREATE",
          entityType: "EmploymentType",
          entityId: Number(id),
          details: `Created employment type ${input.name}`,
        });
        return { success: true, id };
      }),
  }),

  employee: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      return await db.getEmployees(ctx.tenantId);
    }),
    get: tenantProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getEmployeeById(input.id, ctx.tenantId);
      }),
    create: tenantProcedure
      .input(z.object({
        employeeNo: z.string(),
        payrollNo: z.string().optional(),
        firstName: z.string(),
        middleName: z.string().optional(),
        lastName: z.string(),
        gender: z.string().optional(),
        dob: z.string().optional(),
        idNo: z.string().optional(),
        kraPin: z.string(),
        nssfNo: z.string().optional(),
        shifNo: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        branchId: z.number().optional(),
        departmentId: z.number().optional(),
        designationId: z.number().optional(),
        gradeId: z.number().optional(),
        employmentTypeId: z.number().optional(),
        employmentDate: z.string().optional(),
        employmentStatus: z.string().default("Active"),
        basicSalary: z.string(),
        bankName: z.string().optional(),
        bankBranch: z.string().optional(),
        accountNumber: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!["Super Admin", "Company Admin", "HR Manager"].includes(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only HR or Admins can create employees." });
        }
        const id = await db.createEmployee({
          tenantId: ctx.tenantId,
          employeeNo: input.employeeNo,
          payrollNo: input.payrollNo || null,
          firstName: input.firstName,
          middleName: input.middleName || null,
          lastName: input.lastName,
          gender: input.gender || null,
          dob: input.dob ? new Date(input.dob) as any : null,
          idNo: input.idNo || null,
          kraPin: input.kraPin,
          nssfNo: input.nssfNo || null,
          shifNo: input.shifNo || null,
          phone: input.phone || null,
          email: input.email || null,
          branchId: input.branchId || null,
          departmentId: input.departmentId || null,
          designationId: input.designationId || null,
          gradeId: input.gradeId || null,
          employmentTypeId: input.employmentTypeId || null,
          employmentDate: input.employmentDate ? new Date(input.employmentDate) as any : null,
          terminationDate: null,
          employmentStatus: input.employmentStatus,
          basicSalary: input.basicSalary as any,
          bankName: input.bankName || null,
          bankBranch: input.bankBranch || null,
          accountNumber: input.accountNumber || null,
        });

        await db.createAuditLog({
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          userName: ctx.user.name || "User",
          action: "CREATE",
          entityType: "Employee",
          entityId: Number(id),
          details: `Created employee ${input.firstName} ${input.lastName} (${input.employeeNo})`,
        });

        return { success: true, id };
      }),
    update: tenantProcedure
      .input(z.object({
        id: z.number(),
        employeeNo: z.string(),
        payrollNo: z.string().optional(),
        firstName: z.string(),
        middleName: z.string().optional(),
        lastName: z.string(),
        gender: z.string().optional(),
        dob: z.string().optional(),
        idNo: z.string().optional(),
        kraPin: z.string(),
        nssfNo: z.string().optional(),
        shifNo: z.string().optional(),
        phone: z.string().optional(),
        email: z.string().optional(),
        branchId: z.number().optional(),
        departmentId: z.number().optional(),
        designationId: z.number().optional(),
        gradeId: z.number().optional(),
        employmentTypeId: z.number().optional(),
        employmentDate: z.string().optional(),
        employmentStatus: z.string(),
        basicSalary: z.string(),
        bankName: z.string().optional(),
        bankBranch: z.string().optional(),
        accountNumber: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (!["Super Admin", "Company Admin", "HR Manager"].includes(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized to update employee." });
        }
        const { id, ...data } = input;
        await db.updateEmployee(id, ctx.tenantId, {
          ...data,
          dob: data.dob ? new Date(data.dob) as any : null,
          employmentDate: data.employmentDate ? new Date(data.employmentDate) as any : null,
          basicSalary: data.basicSalary as any,
        });

        await db.createAuditLog({
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          userName: ctx.user.name || "User",
          action: "UPDATE",
          entityType: "Employee",
          entityId: id,
          details: `Updated employee ${data.firstName} ${data.lastName} (${data.employeeNo})`,
        });

        return { success: true };
      }),
    delete: tenantProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!["Super Admin", "Company Admin", "HR Manager"].includes(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Unauthorized to delete employee." });
        }
        await db.deleteEmployee(input.id, ctx.tenantId);
        await db.createAuditLog({
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          userName: ctx.user.name || "User",
          action: "DELETE",
          entityType: "Employee",
          entityId: input.id,
          details: `Deleted employee ID ${input.id}`,
        });
        return { success: true };
      }),
  }),

  audit: router({
    list: tenantProcedure.query(async ({ ctx }) => {
      if (!["Super Admin", "Company Admin", "HR Manager"].includes(ctx.user.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return await db.getAuditLogs(ctx.tenantId);
    }),
  }),

  payroll: router({
    periods: tenantProcedure.query(async ({ ctx }) => {
      await db.seedPhase2Data(ctx.tenantId);
      return await db.getPayrollPeriods(ctx.tenantId);
    }),
    createPeriod: tenantProcedure
      .input(z.object({ name: z.string(), month: z.number(), year: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!["Super Admin", "Company Admin", "Payroll Manager"].includes(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only Payroll Managers and Admins can create payroll periods." });
        }
        const id = await db.createPayrollPeriod({ tenantId: ctx.tenantId, ...input });
        await db.createAuditLog({
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          userName: ctx.user.name || "User",
          action: "CREATE",
          entityType: "PayrollPeriod",
          entityId: id,
          details: `Created payroll period ${input.name}`,
        });
        return { success: true, id };
      }),
    transactions: tenantProcedure
      .input(z.object({ payrollPeriodId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getPayrollTransactions(ctx.tenantId, input.payrollPeriodId);
      }),
    runs: tenantProcedure
      .input(z.object({ payrollPeriodId: z.number() }))
      .query(async ({ ctx, input }) => {
        return await db.getPayrollRuns(ctx.tenantId, input.payrollPeriodId);
      }),
    processRun: tenantProcedure
      .input(z.object({ payrollPeriodId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (!["Super Admin", "Company Admin", "Payroll Manager"].includes(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only Payroll Managers and Admins can process payroll." });
        }
        const emps = await db.getEmployees(ctx.tenantId);
        const brackets = await db.getTaxBrackets(ctx.tenantId);
        const [relief] = await db.getTaxReliefs(ctx.tenantId);
        const [housingRate] = await db.getHousingLevyRates(ctx.tenantId);
        const nssfList = await db.getNssfRates(ctx.tenantId);
        const shifList = await db.getShifRates(ctx.tenantId);

        let sumGross = 0;
        let sumPaye = 0;
        let sumNssf = 0;
        let sumShif = 0;
        let sumHousing = 0;
        let sumNet = 0;
        let activeCount = 0;

        for (const emp of emps) {
          if (emp.employmentStatus !== 'Active') continue;
          activeCount++;
          const basic = Number(emp.basicSalary);
          const gross = basic;
          
          // Dynamic NSSF calculation from DB rate tiers
          let nssf = 0;
          const tier1 = nssfList.find(n => n.tierName === 'Tier I');
          const tier2 = nssfList.find(n => n.tierName === 'Tier II');
          const t1Limit = tier1 ? Number(tier1.upperLimit) : 7000;
          const t2Limit = tier2 ? Number(tier2.upperLimit) : 36000;
          const employeeRate = tier1 ? Number(tier1.employeeRate) : 0.06;

          if (gross <= t1Limit) {
            nssf = gross * employeeRate;
          } else {
            const t1Amount = t1Limit * employeeRate;
            const t2Amount = Math.min(gross - t1Limit, t2Limit - t1Limit) * employeeRate;
            nssf = t1Amount + t2Amount;
          }

          const taxableBeforeRelief = Math.max(0, gross - nssf);

          // PAYE calculation across DB tax brackets
          let remaining = taxableBeforeRelief;
          let payeCalc = 0;
          for (const b of brackets) {
            const upper = b.upperLimit ? Number(b.upperLimit) : Infinity;
            const lower = Number(b.lowerLimit);
            const taxableInBand = Math.min(Math.max(0, remaining), upper - lower);
            payeCalc += taxableInBand * Number(b.rate);
            remaining -= taxableInBand;
            if (remaining <= 0) break;
          }

          const personalReliefVal = relief ? Number(relief.monthlyAmount) : 2400;
          const finalPaye = Math.max(0, payeCalc - personalReliefVal);

          // SHIF calculation from DB rate (e.g. 2.75% with 300 min)
          const shifPercentage = shifList.length > 0 ? Number(shifList[0].percentage) : 0.0275;
          const shifMin = shifList.length > 0 ? Number(shifList[0].minAmount) : 300;
          const shif = Math.max(shifMin, gross * shifPercentage);

          // Housing Levy calculation from DB rate (e.g. 1.5%)
          const housingPct = housingRate ? Number(housingRate.employeePercentage) : 0.015;
          const housingLevy = gross * housingPct;

          const totalDeductions = nssf + finalPaye + shif + housingLevy;
          const netPay = Math.max(0, gross - totalDeductions);

          sumGross += gross;
          sumPaye += finalPaye;
          sumNssf += nssf;
          sumShif += shif;
          sumHousing += housingLevy;
          sumNet += netPay;

          // Upsert payroll transaction
          await db.upsertPayrollTransaction(ctx.tenantId, {
            payrollPeriodId: input.payrollPeriodId,
            employeeId: emp.id,
            basicSalary: String(basic),
            allowances: "0.00",
            grossPay: String(gross),
            taxablePay: String(taxableBeforeRelief),
            paye: String(finalPaye.toFixed(2)),
            personalRelief: String(personalReliefVal.toFixed(2)),
            nssf: String(nssf.toFixed(2)),
            shif: String(shif.toFixed(2)),
            housingLevy: String(housingLevy.toFixed(2)),
            otherDeductions: "0.00",
            totalDeductions: String(totalDeductions.toFixed(2)),
            netPay: String(netPay.toFixed(2)),
            status: "Approved"
          });
        }

        // Record payroll run summary
        await db.createPayrollRun(ctx.tenantId, {
          payrollPeriodId: input.payrollPeriodId,
          totalEmployees: activeCount,
          totalGross: sumGross.toFixed(2),
          totalPaye: sumPaye.toFixed(2),
          totalNssf: sumNssf.toFixed(2),
          totalShif: sumShif.toFixed(2),
          totalHousingLevy: sumHousing.toFixed(2),
          totalNet: sumNet.toFixed(2),
          processedBy: ctx.user.id,
          status: "Approved"
        });

        await db.createAuditLog({
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          userName: ctx.user.name || "User",
          action: "PROCESS",
          entityType: "PayrollPeriod",
          entityId: input.payrollPeriodId,
          details: `Processed dynamic Kenyan payroll run for period ID ${input.payrollPeriodId} (${activeCount} employees).`,
        });

        return { success: true };
      }),
  }),

  leave: router({
    types: tenantProcedure.query(async ({ ctx }) => {
      await db.seedPhase2Data(ctx.tenantId);
      return await db.getLeaveTypes(ctx.tenantId);
    }),
    balances: tenantProcedure
      .input(z.object({ employeeId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        let empId = input.employeeId;
        if (!empId && ctx.user.role === 'Employee') {
          const emp = await db.getEmployeeByEmail(ctx.tenantId, ctx.user.email || "");
          empId = emp ? emp.id : 0;
        }
        if (!empId) {
          const emps = await db.getEmployees(ctx.tenantId);
          empId = emps.length > 0 ? emps[0].id : 1;
        }
        return await db.getLeaveBalances(ctx.tenantId, empId);
      }),
    requests: tenantProcedure
      .input(z.object({ employeeId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        let empId = input.employeeId;
        if (ctx.user.role === 'Employee') {
          const emp = await db.getEmployeeByEmail(ctx.tenantId, ctx.user.email || "");
          empId = emp ? emp.id : (empId || 0);
        }
        return await db.getLeaveRequests(ctx.tenantId, empId);
      }),
    createRequest: tenantProcedure
      .input(z.object({
        employeeId: z.number(),
        leaveTypeId: z.number(),
        startDate: z.string(),
        endDate: z.string(),
        daysRequested: z.string(),
        reason: z.string()
      }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createLeaveRequest({ tenantId: ctx.tenantId, ...input });
        await db.createAuditLog({
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          userName: ctx.user.name || "User",
          action: "CREATE",
          entityType: "LeaveRequest",
          entityId: id,
          details: `Requested ${input.daysRequested} days leave`,
        });
        return { success: true, id };
      }),
    updateStatus: tenantProcedure
      .input(z.object({ requestId: z.number(), status: z.enum(['Approved', 'Rejected', 'Cancelled']) }))
      .mutation(async ({ ctx, input }) => {
        if (!["Super Admin", "Company Admin", "HR Manager"].includes(ctx.user.role)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only HR Managers and Admins can approve leave requests." });
        }
        await db.updateLeaveRequestStatus(ctx.tenantId, input.requestId, input.status, ctx.user.id);
        await db.createAuditLog({
          tenantId: ctx.tenantId,
          userId: ctx.user.id,
          userName: ctx.user.name || "User",
          action: "UPDATE",
          entityType: "LeaveRequest",
          entityId: input.requestId,
          details: `Updated leave request ID ${input.requestId} to ${input.status}`,
        });
        return { success: true };
      }),
  }),

  ess: router({
    myProfile: tenantProcedure.query(async ({ ctx }) => {
      const emp = await db.getEmployeeByEmail(ctx.tenantId, ctx.user.email || "");
      if (!emp) {
        // Fallback to first employee for demo admin
        const emps = await db.getEmployees(ctx.tenantId);
        return emps.length > 0 ? emps[0] : null;
      }
      return emp;
    }),
    myPayslips: tenantProcedure.query(async ({ ctx }) => {
      const emp = await db.getEmployeeByEmail(ctx.tenantId, ctx.user.email || "");
      const empId = emp ? emp.id : 1;
      return await db.getEmployeePayslips(ctx.tenantId, empId);
    }),
  }),

  enterprise: router({
    approvals: tenantProcedure.query(async ({ ctx }) => {
      return await db.getApprovalRequests(ctx.tenantId);
    }),
    createApproval: tenantProcedure
      .input(z.object({ workflowType: z.string(), entityId: z.number(), comments: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createApprovalRequest({
          tenantId: ctx.tenantId,
          workflowType: input.workflowType,
          entityId: input.entityId,
          currentStep: 1,
          status: "Pending",
          comments: input.comments || "Submitted for approval",
          submittedBy: ctx.user.id
        });
        return { success: true, id };
      }),
    updateApproval: tenantProcedure
      .input(z.object({ id: z.number(), status: z.enum(["Pending", "Approved", "Rejected", "Escalated"]), currentStep: z.number(), comments: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateApprovalRequestStatus(input.id, ctx.tenantId, input.status, input.currentStep, input.comments);
        return { success: true };
      }),

    glAccounts: tenantProcedure.query(async ({ ctx }) => {
      return await db.getGlAccounts(ctx.tenantId);
    }),
    createGlAccount: tenantProcedure
      .input(z.object({ accountCode: z.string(), accountName: z.string(), accountType: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createGlAccount({ tenantId: ctx.tenantId, ...input });
        return { success: true, id };
      }),
    journalEntries: tenantProcedure.query(async ({ ctx }) => {
      return await db.getJournalEntries(ctx.tenantId);
    }),
    createJournalEntry: tenantProcedure
      .input(z.object({ referenceNo: z.string(), entryDate: z.string(), description: z.string(), totalDebit: z.string(), totalCredit: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createJournalEntry({
          tenantId: ctx.tenantId,
          referenceNo: input.referenceNo,
          entryDate: new Date(input.entryDate),
          description: input.description,
          totalDebit: input.totalDebit as any,
          totalCredit: input.totalCredit as any,
          status: "Posted"
        });
        return { success: true, id };
      }),

    shifts: tenantProcedure.query(async ({ ctx }) => {
      return await db.getShifts(ctx.tenantId);
    }),
    createShift: tenantProcedure
      .input(z.object({ name: z.string(), startTime: z.string(), endTime: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createShift({ tenantId: ctx.tenantId, ...input });
        return { success: true, id };
      }),
    attendance: tenantProcedure.query(async ({ ctx }) => {
      return await db.getAttendanceLogs(ctx.tenantId);
    }),
    createAttendance: tenantProcedure
      .input(z.object({ employeeId: z.number(), logDate: z.string(), status: z.enum(["Present", "Absent", "Late", "On Leave", "Half Day"]), overtimeHours: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createAttendanceLog({
          tenantId: ctx.tenantId,
          employeeId: input.employeeId,
          logDate: new Date(input.logDate),
          status: input.status,
          overtimeHours: input.overtimeHours as any,
          source: "Biometric Device"
        });
        return { success: true, id };
      }),

    vacancies: tenantProcedure.query(async ({ ctx }) => {
      return await db.getJobVacancies(ctx.tenantId);
    }),
    createVacancy: tenantProcedure
      .input(z.object({ title: z.string(), departmentId: z.number(), positions: z.number(), description: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createJobVacancy({ tenantId: ctx.tenantId, ...input, status: "Open" });
        return { success: true, id };
      }),
    candidates: tenantProcedure.query(async ({ ctx }) => {
      return await db.getJobCandidates(ctx.tenantId);
    }),
    createCandidate: tenantProcedure
      .input(z.object({ vacancyId: z.number(), fullName: z.string(), email: z.string(), phone: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createJobCandidate({ tenantId: ctx.tenantId, vacancyId: input.vacancyId, fullName: input.fullName, email: input.email, phone: input.phone, stage: "Applied" });
        return { success: true, id };
      }),
    updateCandidate: tenantProcedure
      .input(z.object({ id: z.number(), stage: z.enum(["Applied", "Screening", "Interview", "Offer Extended", "Hired", "Rejected"]), score: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateCandidateStage(input.id, ctx.tenantId, input.stage, input.score);
        return { success: true };
      }),

    appraisalCycles: tenantProcedure.query(async ({ ctx }) => {
      return await db.getAppraisalCycles(ctx.tenantId);
    }),
    createCycle: tenantProcedure
      .input(z.object({ name: z.string(), startDate: z.string(), endDate: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createAppraisalCycle({
          tenantId: ctx.tenantId,
          name: input.name,
          startDate: new Date(input.startDate),
          endDate: new Date(input.endDate),
          status: "Active"
        });
        return { success: true, id };
      }),
    appraisals: tenantProcedure.query(async ({ ctx }) => {
      return await db.getAppraisals(ctx.tenantId);
    }),
    createAppraisal: tenantProcedure
      .input(z.object({ cycleId: z.number(), employeeId: z.number(), goalsScore: z.string(), competencyScore: z.string(), comments: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const g = parseFloat(input.goalsScore);
        const c = parseFloat(input.competencyScore);
        const final = ((g + c) / 2).toFixed(2);
        const id = await db.createAppraisal({
          tenantId: ctx.tenantId,
          cycleId: input.cycleId,
          employeeId: input.employeeId,
          goalsScore: input.goalsScore as any,
          competencyScore: input.competencyScore as any,
          finalScore: final as any,
          comments: input.comments,
          status: "Reviewed"
        });
        return { success: true, id };
      }),

    assets: tenantProcedure.query(async ({ ctx }) => {
      return await db.getAssets(ctx.tenantId);
    }),
    createAsset: tenantProcedure
      .input(z.object({ assetTag: z.string(), name: z.string(), category: z.string(), serialNumber: z.string().optional(), purchaseCost: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        const id = await db.createAsset({
          tenantId: ctx.tenantId,
          assetTag: input.assetTag,
          name: input.name,
          category: input.category,
          serialNumber: input.serialNumber,
          purchaseCost: input.purchaseCost ? (input.purchaseCost as any) : undefined,
          status: "Available"
        });
        return { success: true, id };
      }),
    assignAsset: tenantProcedure
      .input(z.object({ id: z.number(), employeeId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.assignAsset(input.id, ctx.tenantId, input.employeeId, "Assigned");
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
