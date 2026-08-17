import { eq, and, sql, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, tenants, companies, branches, departments, designations, grades, 
  employmentTypes, employees, auditLogs,
  Tenant, InsertTenant, Company, InsertCompany, Branch, InsertBranch, Department, InsertDepartment,
  Designation, InsertDesignation, Grade, InsertGrade, EmploymentType, InsertEmploymentType,
  Employee, InsertEmployee, AuditLog, InsertAuditLog,
  payrollPeriods, payrollRuns, taxBrackets, taxReliefs, nssfRates, shifRates, housingLevyRates,
  payrollTransactions, leaveTypes, leaveBalances, leaveRequests, notifications,
  approvalWorkflows, approvalRequests, glAccounts, journalEntries, shifts, attendanceLogs,
  jobVacancies, jobCandidates, appraisalCycles, appraisals, assets
} from "../drizzle/schema";
import { ENV } from './_core/env';
import { DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, hashPassword, localOpenIdForEmail } from './auth';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function seedInitialData() {
  const db = await getDb();
  if (!db) return;
  try {
    // Check if tenant exists with robust error handling for missing tables
    let existingTenants: any[] = [];
    try {
      existingTenants = await db.select().from(tenants).limit(1);
    } catch (e) {
      console.warn("[Database] Tenants table not ready yet during seed check:", e);
      return;
    }
    if (existingTenants.length === 0) {
      await db.insert(tenants).values({
        id: 1,
        companyName: "BluePrint Kenya Ltd",
        kraPin: "P051234567X",
        email: "info@blueprint.co.ke",
        phone: "+254 712 345 678",
        address: "Delta Towers, Westlands, Nairobi",
        subdomain: "blueprint",
        status: "Active"
      });
      await db.insert(companies).values({
        id: 1,
        tenantId: 1,
        companyName: "BluePrint Kenya Ltd",
        kraPin: "P051234567X",
        email: "info@blueprint.co.ke",
        phone: "+254 712 345 678",
        address: "Delta Towers, Westlands, Nairobi"
      });
      await db.insert(branches).values({
        id: 1,
        tenantId: 1,
        name: "Nairobi Headquarters",
        code: "HQ",
        location: "Westlands, Nairobi"
      });
      await db.insert(departments).values([
        { id: 1, tenantId: 1, name: "Human Resources", code: "HR", branchId: 1 },
        { id: 2, tenantId: 1, name: "Finance & Payroll", code: "FIN", branchId: 1 },
        { id: 3, tenantId: 1, name: "Engineering", code: "ENG", branchId: 1 }
      ]);
      await db.insert(designations).values([
        { id: 1, tenantId: 1, name: "HR Manager", description: "Manages HR policies and employee relations" },
        { id: 2, tenantId: 1, name: "Payroll Accountant", description: "Handles Kenya statutory payroll and tax filings" },
        { id: 3, tenantId: 1, name: "Senior Software Engineer", description: "Core technical development" }
      ]);
      await db.insert(grades).values([
        { id: 1, tenantId: 1, name: "Grade A - Executive", level: "A", minSalary: "150000", maxSalary: "300000" },
        { id: 2, tenantId: 1, name: "Grade B - Management", level: "B", minSalary: "90000", maxSalary: "149000" },
        { id: 3, tenantId: 1, name: "Grade C - Staff", level: "C", minSalary: "45000", maxSalary: "89000" }
      ]);
      await db.insert(employmentTypes).values([
        { id: 1, tenantId: 1, name: "Permanent", description: "Permanent and pensionable contract" },
        { id: 2, tenantId: 1, name: "Contract", description: "Fixed term contract" },
        { id: 3, tenantId: 1, name: "Intern", description: "Internship program" }
      ]);
      await db.insert(employees).values([
        {
          id: 1,
          tenantId: 1,
          employeeNo: "EMP-2026-001",
          payrollNo: "PAY-001",
          firstName: "George",
          middleName: "Wamola",
          lastName: "Kenyatta",
          gender: "Male",
          dob: "1990-05-12" as any,
          idNo: "28451234",
          kraPin: "A001234567Y",
          nssfNo: "NSSF123456",
          shifNo: "SHIF987654",
          phone: "+254 722 000 111",
          email: "george.wamola@blueprint.co.ke",
          branchId: 1,
          departmentId: 1,
          designationId: 1,
          gradeId: 1,
          employmentTypeId: 1,
          employmentDate: "2023-01-15" as any,
          employmentStatus: "Active",
          basicSalary: "180000",
          bankName: "Equity Bank",
          bankBranch: "Westlands",
          accountNumber: "0123456789012"
        },
        {
          id: 2,
          tenantId: 1,
          employeeNo: "EMP-2026-002",
          payrollNo: "PAY-002",
          firstName: "Amina",
          middleName: "Wanjiku",
          lastName: "Odhiambo",
          gender: "Female",
          dob: "1994-08-22" as any,
          idNo: "29876543",
          kraPin: "A009876543Z",
          nssfNo: "NSSF654321",
          shifNo: "SHIF123456",
          phone: "+254 733 111 222",
          email: "amina.odhiambo@blueprint.co.ke",
          branchId: 1,
          departmentId: 2,
          designationId: 2,
          gradeId: 2,
          employmentTypeId: 1,
          employmentDate: "2023-06-01" as any,
          employmentStatus: "Active",
          basicSalary: "125000",
          bankName: "KCB Bank",
          bankBranch: "Moi Avenue",
          accountNumber: "1122334455667"
        }
      ]);
      await db.insert(auditLogs).values({
        tenantId: 1,
        userId: 1,
        userName: "System Seeder",
        action: "CREATE",
        entityType: "System",
        entityId: 1,
        details: "Initialized BluePrint HR Phase 1 seed data with Kenya statutory compliance config."
      });
    }

    // Ensure a local administrator can access the application even when OAuth is unavailable.
    const adminRows = await db.select().from(users).where(eq(users.email, DEFAULT_ADMIN_EMAIL)).limit(1);
    if (adminRows.length === 0) {
      await db.insert(users).values({
        openId: localOpenIdForEmail(DEFAULT_ADMIN_EMAIL),
        name: "BluePrint HR Administrator",
        email: DEFAULT_ADMIN_EMAIL,
        passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
        loginMethod: "password",
        tenantId: 1,
        role: "Company Admin",
        lastSignedIn: new Date(),
      });
    } else if (!adminRows[0]?.passwordHash) {
      await db.update(users).set({ passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD), loginMethod: "password" }).where(eq(users.id, adminRows[0].id));
    }
  } catch (err) {
    console.error("[Database] Seed error:", err);
  }
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.tenantId !== undefined) {
      values.tenantId = user.tenantId;
      updateSet.tenantId = user.tenantId;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'Super Admin';
      updateSet.role = 'Super Admin';
    }

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase())).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// Audit logger helper
export async function createAuditLog(log: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;
  try {
    await db.insert(auditLogs).values(log);
  } catch (err) {
    console.error("[Database] Failed to create audit log:", err);
  }
}

// Tenants & Companies
export async function getTenants() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(tenants);
}

export async function getTenantById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const res = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return res[0];
}

export async function createTenant(data: InsertTenant) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.insert(tenants).values(data);
  const tenantId = res[0].insertId;
  await db.insert(companies).values({
    tenantId: Number(tenantId),
    companyName: data.companyName,
    kraPin: data.kraPin,
    email: data.email,
    phone: data.phone,
    address: data.address,
  });
  return tenantId;
}

export async function getCompanies(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(companies).where(eq(companies.tenantId, tenantId));
}

// Branches
export async function getBranches(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(branches).where(eq(branches.tenantId, tenantId));
}

export async function createBranch(data: InsertBranch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.insert(branches).values(data);
  return res[0].insertId;
}

// Departments
export async function getDepartments(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(departments).where(eq(departments.tenantId, tenantId));
}

export async function createDepartment(data: InsertDepartment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.insert(departments).values(data);
  return res[0].insertId;
}

// Designations
export async function getDesignations(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(designations).where(eq(designations.tenantId, tenantId));
}

export async function createDesignation(data: InsertDesignation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.insert(designations).values(data);
  return res[0].insertId;
}

// Grades
export async function getGrades(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(grades).where(eq(grades.tenantId, tenantId));
}

export async function createGrade(data: InsertGrade) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.insert(grades).values(data);
  return res[0].insertId;
}

// Employment Types
export async function getEmploymentTypes(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(employmentTypes).where(eq(employmentTypes.tenantId, tenantId));
}

export async function createEmploymentType(data: InsertEmploymentType) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.insert(employmentTypes).values(data);
  return res[0].insertId;
}

// Employees
export async function getEmployees(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(employees).where(eq(employees.tenantId, tenantId));
}

export async function getEmployeeById(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const res = await db.select().from(employees).where(and(eq(employees.id, id), eq(employees.tenantId, tenantId))).limit(1);
  return res[0];
}

export async function createEmployee(data: InsertEmployee) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const res = await db.insert(employees).values(data);
  return res[0].insertId;
}

export async function updateEmployee(id: number, tenantId: number, data: Partial<InsertEmployee>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(employees).set(data).where(and(eq(employees.id, id), eq(employees.tenantId, tenantId)));
}

export async function deleteEmployee(id: number, tenantId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(employees).where(and(eq(employees.id, id), eq(employees.tenantId, tenantId)));
}

// Audit Logs retrieval
export async function getAuditLogs(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(auditLogs).where(eq(auditLogs.tenantId, tenantId)).orderBy(desc(auditLogs.createdAt)).limit(100);
}

// --- Phase 2: Statutory & Payroll Seed & Helpers ---

export async function seedPhase2Data(tenantId: number) {
  const db = await getDb();
  if (!db) return;
  try {
    // Check tax brackets
    const brackets = await db.select().from(taxBrackets).where(eq(taxBrackets.tenantId, tenantId)).limit(1);
    if (brackets.length === 0) {
      // Kenya PAYE brackets 2024/2025/2026: 10% on first 24,000, 25% on next 8,000, 30% on next 468,000, 32.5% on next 300,000, 35% above
      await db.insert(taxBrackets).values([
        { tenantId, bandOrder: 1, lowerLimit: "0", upperLimit: "24000", rate: "0.1000" },
        { tenantId, bandOrder: 2, lowerLimit: "24001", upperLimit: "32333", rate: "0.2500" },
        { tenantId, bandOrder: 3, lowerLimit: "32334", upperLimit: "500000", rate: "0.3000" },
        { tenantId, bandOrder: 4, lowerLimit: "500001", upperLimit: "800000", rate: "0.3250" },
        { tenantId, bandOrder: 5, lowerLimit: "800001", upperLimit: null, rate: "0.3500" },
      ]);
      await db.insert(taxReliefs).values([
        { tenantId, reliefName: "Personal Relief", monthlyAmount: "2400.00" },
        { tenantId, reliefName: "Insurance Relief", monthlyAmount: "240.00" },
      ]);
      await db.insert(nssfRates).values([
        { tenantId, tierName: "Tier I", lowerLimit: "0", upperLimit: "8000", employeeRate: "0.0600", employerRate: "0.0600" },
        { tenantId, tierName: "Tier II", lowerLimit: "8001", upperLimit: "72000", employeeRate: "0.0600", employerRate: "0.0600" },
      ]);
      await db.insert(shifRates).values([
        { tenantId, percentage: "0.0275", minAmount: "300.00" },
      ]);
      await db.insert(housingLevyRates).values([
        { tenantId, employeePercentage: "0.0150", employerPercentage: "0.0150" },
      ]);
      await db.insert(leaveTypes).values([
        { tenantId, name: "Annual Leave", defaultDays: 21, paid: "Yes", description: "Standard annual paid leave" },
        { tenantId, name: "Sick Leave", defaultDays: 14, paid: "Yes", description: "Paid sick leave with medical certificate" },
        { tenantId, name: "Compassionate Leave", defaultDays: 5, paid: "Yes", description: "For bereavement or family emergency" },
        { tenantId, name: "Maternity Leave", defaultDays: 90, paid: "Yes", description: "Paid maternity leave for female employees" },
        { tenantId, name: "Paternity Leave", defaultDays: 14, paid: "Yes", description: "Paid paternity leave for male employees" },
        { tenantId, name: "Study Leave", defaultDays: 10, paid: "No", description: "Unpaid or study-supported leave" },
      ]);
      // Seed leave balances for existing employees (id 1 and 2)
      const allEmps = await db.select().from(employees).where(eq(employees.tenantId, tenantId));
      const types = await db.select().from(leaveTypes).where(eq(leaveTypes.tenantId, tenantId));
      for (const emp of allEmps) {
        for (const lt of types) {
          await db.insert(leaveBalances).values({
            tenantId,
            employeeId: emp.id,
            leaveTypeId: lt.id,
            year: new Date().getFullYear(),
            allocatedDays: String(lt.defaultDays),
            usedDays: "0.00",
            carriedForward: "0.00"
          });
        }
      }
      // Seed a default open payroll period for August 2026
      await db.insert(payrollPeriods).values({
        tenantId,
        name: "August 2026",
        month: 8,
        year: 2026,
        status: "Open"
      });
    }
  } catch (err) {
    console.error("[Database] Phase 2 seed error:", err);
  }
}

// Payroll Helpers
export async function getPayrollPeriods(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payrollPeriods).where(eq(payrollPeriods.tenantId, tenantId));
}

export async function createPayrollPeriod(data: { tenantId: number; name: string; month: number; year: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [res] = await db.insert(payrollPeriods).values({ ...data, status: "Open" });
  return res.insertId;
}

export async function getPayrollTransactions(tenantId: number, payrollPeriodId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payrollTransactions).where(
    and(eq(payrollTransactions.tenantId, tenantId), eq(payrollTransactions.payrollPeriodId, payrollPeriodId))
  );
}

// Leave Helpers
export async function getLeaveTypes(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leaveTypes).where(eq(leaveTypes.tenantId, tenantId));
}

export async function getLeaveBalances(tenantId: number, employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leaveBalances).where(
    and(eq(leaveBalances.tenantId, tenantId), eq(leaveBalances.employeeId, employeeId))
  );
}

export async function getLeaveRequests(tenantId: number, employeeId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (employeeId) {
    return db.select().from(leaveRequests).where(
      and(eq(leaveRequests.tenantId, tenantId), eq(leaveRequests.employeeId, employeeId))
    );
  }
  return db.select().from(leaveRequests).where(eq(leaveRequests.tenantId, tenantId));
}

export async function createLeaveRequest(data: {
  tenantId: number;
  employeeId: number;
  leaveTypeId: number;
  startDate: string;
  endDate: string;
  daysRequested: string;
  reason: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [res] = await db.insert(leaveRequests).values({
    ...data,
    startDate: data.startDate as any,
    endDate: data.endDate as any,
    status: "Pending"
  });
  return res.insertId;
}

export async function updateLeaveRequestStatus(tenantId: number, requestId: number, status: 'Approved' | 'Rejected' | 'Cancelled', approvedBy: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(leaveRequests).set({
    status,
    approvedBy,
    approvedAt: new Date()
  }).where(and(eq(leaveRequests.tenantId, tenantId), eq(leaveRequests.id, requestId)));

  // If approved, deduct from leave balance
  if (status === 'Approved') {
    const [req] = await db.select().from(leaveRequests).where(eq(leaveRequests.id, requestId)).limit(1);
    if (req) {
      const [bal] = await db.select().from(leaveBalances).where(
        and(eq(leaveBalances.tenantId, tenantId), eq(leaveBalances.employeeId, req.employeeId), eq(leaveBalances.leaveTypeId, req.leaveTypeId))
      ).limit(1);
      if (bal) {
        const newUsed = Number(bal.usedDays) + Number(req.daysRequested);
        await db.update(leaveBalances).set({ usedDays: String(newUsed) }).where(eq(leaveBalances.id, bal.id));
      }
    }
  }
}

// Notifications Helpers
export async function getNotifications(tenantId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(notifications).where(
    and(eq(notifications.tenantId, tenantId), eq(notifications.userId, userId))
  );
}

export async function createNotification(data: { tenantId: number; userId: number; title: string; message: string }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values({ ...data, isRead: 0 });
}

// Additional helper functions for Phase 2 routers
export async function getTaxBrackets(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taxBrackets).where(eq(taxBrackets.tenantId, tenantId)).orderBy(taxBrackets.bandOrder);
}

export async function getTaxReliefs(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(taxReliefs).where(eq(taxReliefs.tenantId, tenantId));
}

export async function getHousingLevyRates(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(housingLevyRates).where(eq(housingLevyRates.tenantId, tenantId));
}

export async function getEmployeeByEmail(tenantId: number, email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const res = await db.select().from(employees).where(
    and(eq(employees.tenantId, tenantId), eq(employees.email, email.trim().toLowerCase()))
  ).limit(1);
  return res.length > 0 ? res[0] : undefined;
}

export async function upsertPayrollTransaction(tenantId: number, data: {
  payrollPeriodId: number;
  employeeId: number;
  basicSalary: string;
  allowances: string;
  grossPay: string;
  taxablePay: string;
  paye: string;
  personalRelief: string;
  nssf: string;
  shif: string;
  housingLevy: string;
  otherDeductions: string;
  totalDeductions: string;
  netPay: string;
  status: 'Draft' | 'Approved' | 'Paid';
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  // Check existing
  const existing = await db.select().from(payrollTransactions).where(
    and(
      eq(payrollTransactions.tenantId, tenantId),
      eq(payrollTransactions.payrollPeriodId, data.payrollPeriodId),
      eq(payrollTransactions.employeeId, data.employeeId)
    )
  ).limit(1);

  if (existing.length > 0) {
    await db.update(payrollTransactions).set(data).where(eq(payrollTransactions.id, existing[0].id));
  } else {
    await db.insert(payrollTransactions).values({ tenantId, ...data });
  }
}

export async function getEmployeePayslips(tenantId: number, employeeId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payrollTransactions).where(
    and(eq(payrollTransactions.tenantId, tenantId), eq(payrollTransactions.employeeId, employeeId))
  );
}

export async function getNssfRates(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(nssfRates).where(eq(nssfRates.tenantId, tenantId));
}

export async function getShifRates(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shifRates).where(eq(shifRates.tenantId, tenantId));
}

export async function updateEmployeeProfile(tenantId: number, employeeId: number, data: Partial<InsertEmployee>) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  await db.update(employees).set(data).where(
    and(eq(employees.tenantId, tenantId), eq(employees.id, employeeId))
  );
}

export async function createPayrollRun(tenantId: number, data: {
  payrollPeriodId: number;
  totalEmployees: number;
  totalGross: string;
  totalPaye: string;
  totalNssf: string;
  totalShif: string;
  totalHousingLevy: string;
  totalNet: string;
  processedBy?: number;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Locked';
}) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  const [res] = await db.insert(payrollRuns).values({ tenantId, ...data });
  return res.insertId;
}

export async function getPayrollRuns(tenantId: number, payrollPeriodId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(payrollRuns).where(
    and(eq(payrollRuns.tenantId, tenantId), eq(payrollRuns.payrollPeriodId, payrollPeriodId))
  );
}


// --- Phase 3 Enterprise Helpers ---

export async function getApprovalRequests(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(approvalRequests).where(eq(approvalRequests.tenantId, tenantId));
}

export async function createApprovalRequest(data: typeof approvalRequests.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [res] = await db.insert(approvalRequests).values(data);
  return res.insertId;
}

export async function updateApprovalRequestStatus(id: number, tenantId: number, status: "Pending" | "Approved" | "Rejected" | "Escalated", currentStep: number, comments?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(approvalRequests)
    .set({ status, currentStep, comments, updatedAt: new Date() })
    .where(and(eq(approvalRequests.id, id), eq(approvalRequests.tenantId, tenantId)));
}

export async function getGlAccounts(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(glAccounts).where(eq(glAccounts.tenantId, tenantId));
}

export async function createGlAccount(data: typeof glAccounts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [res] = await db.insert(glAccounts).values(data);
  return res.insertId;
}

export async function getJournalEntries(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(journalEntries).where(eq(journalEntries.tenantId, tenantId));
}

export async function createJournalEntry(data: typeof journalEntries.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [res] = await db.insert(journalEntries).values(data);
  return res.insertId;
}

export async function getShifts(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shifts).where(eq(shifts.tenantId, tenantId));
}

export async function createShift(data: typeof shifts.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [res] = await db.insert(shifts).values(data);
  return res.insertId;
}

export async function getAttendanceLogs(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(attendanceLogs).where(eq(attendanceLogs.tenantId, tenantId));
}

export async function createAttendanceLog(data: typeof attendanceLogs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [res] = await db.insert(attendanceLogs).values(data);
  return res.insertId;
}

export async function getJobVacancies(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobVacancies).where(eq(jobVacancies.tenantId, tenantId));
}

export async function createJobVacancy(data: typeof jobVacancies.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [res] = await db.insert(jobVacancies).values(data);
  return res.insertId;
}

export async function getJobCandidates(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(jobCandidates).where(eq(jobCandidates.tenantId, tenantId));
}

export async function createJobCandidate(data: typeof jobCandidates.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [res] = await db.insert(jobCandidates).values(data);
  return res.insertId;
}

export async function updateCandidateStage(id: number, tenantId: number, stage: "Applied" | "Screening" | "Interview" | "Offer Extended" | "Hired" | "Rejected", score?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(jobCandidates)
    .set({ stage, score: score ? score as any : undefined })
    .where(and(eq(jobCandidates.id, id), eq(jobCandidates.tenantId, tenantId)));
}

export async function getAppraisalCycles(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appraisalCycles).where(eq(appraisalCycles.tenantId, tenantId));
}

export async function createAppraisalCycle(data: typeof appraisalCycles.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [res] = await db.insert(appraisalCycles).values(data);
  return res.insertId;
}

export async function getAppraisals(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(appraisals).where(eq(appraisals.tenantId, tenantId));
}

export async function createAppraisal(data: typeof appraisals.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [res] = await db.insert(appraisals).values(data);
  return res.insertId;
}

export async function getAssets(tenantId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assets).where(eq(assets.tenantId, tenantId));
}

export async function createAsset(data: typeof assets.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [res] = await db.insert(assets).values(data);
  return res.insertId;
}

export async function assignAsset(id: number, tenantId: number, assignedTo: number, status: "Available" | "Assigned" | "Under Maintenance" | "Retired") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(assets)
    .set({ assignedTo, status })
    .where(and(eq(assets.id, id), eq(assets.tenantId, tenantId)));
}
