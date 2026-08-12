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
});

export type AppRouter = typeof appRouter;
