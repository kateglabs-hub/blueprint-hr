import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, date, decimal, index } from "drizzle-orm/mysql-core";

/**
 * Core users table backing auth flow, extended with tenantId and explicit HR roles.
 * Roles: Super Admin, Company Admin, HR Manager, Payroll Manager, Employee
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  tenantId: int("tenantId").default(1),
  role: mysqlEnum("role", [
    "Super Admin",
    "Company Admin",
    "HR Manager",
    "Payroll Manager",
    "Employee",
    "user",
    "admin"
  ]).default("Employee").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

/**
 * Tenants table representing client organizations / companies.
 */
export const tenants = mysqlTable("tenants", {
  id: int("id").autoincrement().primaryKey(),
  companyName: varchar("companyName", { length: 200 }).notNull(),
  kraPin: varchar("kraPin", { length: 20 }),
  email: varchar("email", { length: 150 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  subdomain: varchar("subdomain", { length: 100 }).unique(),
  status: mysqlEnum("status", ["Active", "Suspended", "Trial"]).default("Active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * Organization: Branches
 */
export const branches = mysqlTable("branches", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  code: varchar("code", { length: 50 }),
  location: varchar("location", { length: 150 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

/**
 * Organization: Departments
 */
export const departments = mysqlTable("departments", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  code: varchar("code", { length: 50 }),
  branchId: int("branchId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

/**
 * Organization: Designations
 */
export const designations = mysqlTable("designations", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

/**
 * Organization: Grades / Job Groups
 */
export const grades = mysqlTable("grades", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  level: varchar("level", { length: 50 }),
  minSalary: decimal("minSalary", { precision: 12, scale: 2 }),
  maxSalary: decimal("maxSalary", { precision: 12, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

/**
 * Organization: Employment Types
 */
export const employmentTypes = mysqlTable("employment_types", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // Permanent, Contract, Intern, Probation
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

/**
 * Employee Master with all key fields: KRA PIN, NSSF Number, SHIF Number, bank details, etc.
 */
export const employees = mysqlTable("employees", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  employeeNo: varchar("employeeNo", { length: 50 }).notNull(),
  payrollNo: varchar("payrollNo", { length: 50 }),
  firstName: varchar("firstName", { length: 100 }).notNull(),
  middleName: varchar("middleName", { length: 100 }),
  lastName: varchar("lastName", { length: 100 }).notNull(),
  gender: varchar("gender", { length: 20 }),
  dob: date("dob"),
  idNo: varchar("idNo", { length: 30 }),
  kraPin: varchar("kraPin", { length: 30 }).notNull(), // KRA PIN
  nssfNo: varchar("nssfNo", { length: 30 }), // NSSF Number
  shifNo: varchar("shifNo", { length: 30 }), // SHIF Number (Social Health Insurance Fund)
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 150 }),
  branchId: int("branchId"),
  departmentId: int("departmentId"),
  designationId: int("designationId"),
  gradeId: int("gradeId"),
  employmentTypeId: int("employmentTypeId"),
  employmentDate: date("employmentDate"),
  terminationDate: date("terminationDate"),
  employmentStatus: varchar("employmentStatus", { length: 30 }).default("Active").notNull(), // Active, Terminated, Suspended, Resigned
  basicSalary: decimal("basicSalary", { precision: 12, scale: 2 }).notNull(),
  bankName: varchar("bankName", { length: 100 }),
  bankBranch: varchar("bankBranch", { length: 100 }),
  accountNumber: varchar("accountNumber", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

/**
 * Audit Logs tracking all create, update, and delete actions across tenant data.
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId"),
  userName: varchar("userName", { length: 150 }),
  action: varchar("action", { length: 50 }).notNull(), // CREATE, UPDATE, DELETE
  entityType: varchar("entityType", { length: 100 }).notNull(), // Employee, Department, Tenant, etc.
  entityId: int("entityId"),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 50 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type Tenant = typeof tenants.$inferSelect;
export type InsertTenant = typeof tenants.$inferInsert;

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = typeof branches.$inferInsert;

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = typeof departments.$inferInsert;

export type Designation = typeof designations.$inferSelect;
export type InsertDesignation = typeof designations.$inferInsert;

export type Grade = typeof grades.$inferSelect;
export type InsertGrade = typeof grades.$inferInsert;

export type EmploymentType = typeof employmentTypes.$inferSelect;
export type InsertEmploymentType = typeof employmentTypes.$inferInsert;

export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = typeof employees.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;
