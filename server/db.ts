import { eq, and, sql, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, tenants, branches, departments, designations, grades, 
  employmentTypes, employees, auditLogs,
  Tenant, InsertTenant, Branch, InsertBranch, Department, InsertDepartment,
  Designation, InsertDesignation, Grade, InsertGrade, EmploymentType, InsertEmploymentType,
  Employee, InsertEmployee, AuditLog, InsertAuditLog
} from "../drizzle/schema";
import { ENV } from './_core/env';

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

// Tenants
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
  return res[0].insertId;
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
