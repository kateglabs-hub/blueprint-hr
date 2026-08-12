import { eq, and, sql, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, tenants, companies, branches, departments, designations, grades, 
  employmentTypes, employees, auditLogs,
  Tenant, InsertTenant, Company, InsertCompany, Branch, InsertBranch, Department, InsertDepartment,
  Designation, InsertDesignation, Grade, InsertGrade, EmploymentType, InsertEmploymentType,
  Employee, InsertEmployee, AuditLog, InsertAuditLog
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
    // Check if tenant exists
    const existingTenants = await db.select().from(tenants).limit(1);
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
