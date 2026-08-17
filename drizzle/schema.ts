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
  passwordHash: text("passwordHash"),
  loginMethod: varchar("loginMethod", { length: 64 }),
  tenantId: int("tenantId").default(1),
  role: mysqlEnum("role", [
    "Super Admin",
    "Company Admin",
    "HR Manager",
    "Payroll Manager",
    "Employee"
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
 * Companies table mirroring tenant enterprise profiles as specified in spec.
 */
export const companies = mysqlTable("companies", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  companyName: varchar("companyName", { length: 200 }).notNull(),
  kraPin: varchar("kraPin", { length: 20 }),
  email: varchar("email", { length: 150 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

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
  name: varchar("name", { length: 100 }).notNull(),
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
  kraPin: varchar("kraPin", { length: 30 }).notNull(),
  nssfNo: varchar("nssfNo", { length: 30 }),
  shifNo: varchar("shifNo", { length: 30 }),
  phone: varchar("phone", { length: 30 }),
  email: varchar("email", { length: 150 }),
  branchId: int("branchId"),
  departmentId: int("departmentId"),
  designationId: int("designationId"),
  gradeId: int("gradeId"),
  employmentTypeId: int("employmentTypeId"),
  employmentDate: date("employmentDate"),
  terminationDate: date("terminationDate"),
  employmentStatus: varchar("employmentStatus", { length: 30 }).default("Active").notNull(),
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
  action: varchar("action", { length: 50 }).notNull(),
  entityType: varchar("entityType", { length: 100 }).notNull(),
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

export type Company = typeof companies.$inferSelect;
export type InsertCompany = typeof companies.$inferInsert;

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


// --- Phase 2: Payroll, Statutory Rates, Leave & ESS ---

export const payrollPeriods = mysqlTable("payroll_periods", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // e.g. "August 2026"
  month: int("month").notNull(), // 1-12
  year: int("year").notNull(), // 2026
  status: mysqlEnum("status", ["Open", "Processing", "Approved", "Locked"]).default("Open").notNull(),
  processedAt: timestamp("processedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const payrollRuns = mysqlTable("payroll_runs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  payrollPeriodId: int("payrollPeriodId").notNull(),
  totalEmployees: int("totalEmployees").notNull(),
  totalGross: decimal("totalGross", { precision: 15, scale: 2 }).notNull(),
  totalPaye: decimal("totalPaye", { precision: 15, scale: 2 }).notNull(),
  totalNssf: decimal("totalNssf", { precision: 15, scale: 2 }).notNull(),
  totalShif: decimal("totalShif", { precision: 15, scale: 2 }).notNull(),
  totalHousingLevy: decimal("totalHousingLevy", { precision: 15, scale: 2 }).notNull(),
  totalNet: decimal("totalNet", { precision: 15, scale: 2 }).notNull(),
  processedBy: int("processedBy"),
  status: mysqlEnum("status", ["Draft", "Submitted", "Approved", "Locked"]).default("Draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const taxBrackets = mysqlTable("tax_brackets", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  bandOrder: int("bandOrder").notNull(),
  lowerLimit: decimal("lowerLimit", { precision: 12, scale: 2 }).notNull(),
  upperLimit: decimal("upperLimit", { precision: 12, scale: 2 }), // null for infinite
  rate: decimal("rate", { precision: 5, scale: 4 }).notNull(), // e.g. 0.1000 for 10%
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const taxReliefs = mysqlTable("tax_reliefs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  reliefName: varchar("reliefName", { length: 100 }).notNull(), // e.g. "Personal Relief", "Insurance Relief"
  monthlyAmount: decimal("monthlyAmount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const nssfRates = mysqlTable("nssf_rates", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  tierName: varchar("tierName", { length: 50 }).notNull(), // "Tier I", "Tier II"
  lowerLimit: decimal("lowerLimit", { precision: 10, scale: 2 }).notNull(),
  upperLimit: decimal("upperLimit", { precision: 10, scale: 2 }).notNull(),
  employeeRate: decimal("employeeRate", { precision: 5, scale: 4 }).notNull(), // e.g. 0.0600
  employerRate: decimal("employerRate", { precision: 5, scale: 4 }).notNull(), // e.g. 0.0600
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const shifRates = mysqlTable("shif_rates", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 4 }).notNull(), // e.g. 0.0275 for 2.75%
  minAmount: decimal("minAmount", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const housingLevyRates = mysqlTable("housing_levy_rates", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  employeePercentage: decimal("employeePercentage", { precision: 5, scale: 4 }).notNull(), // e.g. 0.0150 for 1.5%
  employerPercentage: decimal("employerPercentage", { precision: 5, scale: 4 }).notNull(), // e.g. 0.0150
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const payrollTransactions = mysqlTable("payroll_transactions", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  payrollPeriodId: int("payrollPeriodId").notNull(),
  employeeId: int("employeeId").notNull(),
  basicSalary: decimal("basicSalary", { precision: 12, scale: 2 }).notNull(),
  allowances: decimal("allowances", { precision: 12, scale: 2 }).default("0.00").notNull(),
  grossPay: decimal("grossPay", { precision: 12, scale: 2 }).notNull(),
  taxablePay: decimal("taxablePay", { precision: 12, scale: 2 }).notNull(),
  paye: decimal("paye", { precision: 12, scale: 2 }).notNull(),
  personalRelief: decimal("personalRelief", { precision: 12, scale: 2 }).notNull(),
  nssf: decimal("nssf", { precision: 12, scale: 2 }).notNull(),
  shif: decimal("shif", { precision: 12, scale: 2 }).notNull(),
  housingLevy: decimal("housingLevy", { precision: 12, scale: 2 }).notNull(),
  otherDeductions: decimal("otherDeductions", { precision: 12, scale: 2 }).default("0.00").notNull(),
  totalDeductions: decimal("totalDeductions", { precision: 12, scale: 2 }).notNull(),
  netPay: decimal("netPay", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["Draft", "Approved", "Paid"]).default("Draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const leaveTypes = mysqlTable("leave_types", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // Annual, Sick, Compassionate, Maternity, Paternity, Study
  defaultDays: int("defaultDays").notNull(),
  paid: mysqlEnum("paid", ["Yes", "No"]).default("Yes").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const leaveBalances = mysqlTable("leave_balances", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  employeeId: int("employeeId").notNull(),
  leaveTypeId: int("leaveTypeId").notNull(),
  year: int("year").notNull(),
  allocatedDays: decimal("allocatedDays", { precision: 5, scale: 2 }).notNull(),
  usedDays: decimal("usedDays", { precision: 5, scale: 2 }).default("0.00").notNull(),
  carriedForward: decimal("carriedForward", { precision: 5, scale: 2 }).default("0.00").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const leaveRequests = mysqlTable("leave_requests", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  employeeId: int("employeeId").notNull(),
  leaveTypeId: int("leaveTypeId").notNull(),
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  daysRequested: decimal("daysRequested", { precision: 5, scale: 2 }).notNull(),
  reason: text("reason").notNull(),
  status: mysqlEnum("status", ["Pending", "Approved", "Rejected", "Cancelled"]).default("Pending").notNull(),
  approvedBy: int("approvedBy"),
  approvedAt: timestamp("approvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 150 }).notNull(),
  message: text("message").notNull(),
  isRead: int("isRead").default(0).notNull(), // 0 unread, 1 read
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));


// --- Phase 3: Approvals, Accounting, Time & Attendance, Recruitment, Performance, Assets ---

export const approvalWorkflows = mysqlTable("approval_workflows", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  workflowType: varchar("workflowType", { length: 50 }).notNull(), // payroll, leave, recruitment, asset
  stepOrder: int("stepOrder").notNull(),
  roleRequired: varchar("roleRequired", { length: 50 }).notNull(), // Supervisor, HR Manager, Finance, Super Admin
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const approvalRequests = mysqlTable("approval_requests", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  workflowType: varchar("workflowType", { length: 50 }).notNull(),
  entityId: int("entityId").notNull(), // id of leave request, payroll run, job offer, etc.
  currentStep: int("currentStep").default(1).notNull(),
  status: mysqlEnum("status", ["Pending", "Approved", "Rejected", "Escalated"]).default("Pending").notNull(),
  comments: text("comments"),
  submittedBy: int("submittedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const glAccounts = mysqlTable("gl_accounts", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  accountCode: varchar("accountCode", { length: 50 }).notNull(),
  accountName: varchar("accountName", { length: 150 }).notNull(),
  accountType: varchar("accountType", { length: 50 }).notNull(), // Asset, Liability, Equity, Revenue, Expense
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const journalEntries = mysqlTable("journal_entries", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  referenceNo: varchar("referenceNo", { length: 100 }).notNull(),
  entryDate: date("entryDate").notNull(),
  description: text("description").notNull(),
  totalDebit: decimal("totalDebit", { precision: 15, scale: 2 }).notNull(),
  totalCredit: decimal("totalCredit", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["Draft", "Posted", "Void"]).default("Draft").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const shifts = mysqlTable("shifts", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // Morning, Afternoon, Night
  startTime: varchar("startTime", { length: 10 }).notNull(), // 08:00
  endTime: varchar("endTime", { length: 10 }).notNull(), // 17:00
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const attendanceLogs = mysqlTable("attendance_logs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  employeeId: int("employeeId").notNull(),
  logDate: date("logDate").notNull(),
  clockIn: timestamp("clockIn"),
  clockOut: timestamp("clockOut"),
  status: mysqlEnum("status", ["Present", "Absent", "Late", "On Leave", "Half Day"]).default("Present").notNull(),
  overtimeHours: decimal("overtimeHours", { precision: 5, scale: 2 }).default("0.00").notNull(),
  source: varchar("source", { length: 50 }).default("Biometric Device").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const jobVacancies = mysqlTable("job_vacancies", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  title: varchar("title", { length: 150 }).notNull(),
  departmentId: int("departmentId").notNull(),
  positions: int("positions").default(1).notNull(),
  status: mysqlEnum("status", ["Open", "Closed", "Draft"]).default("Open").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const jobCandidates = mysqlTable("job_candidates", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  vacancyId: int("vacancyId").notNull(),
  fullName: varchar("fullName", { length: 150 }).notNull(),
  email: varchar("email", { length: 150 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  stage: mysqlEnum("stage", ["Applied", "Screening", "Interview", "Offer Extended", "Hired", "Rejected"]).default("Applied").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const appraisalCycles = mysqlTable("appraisal_cycles", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  name: varchar("name", { length: 150 }).notNull(), // Q1 2026 Review, Annual 2025
  startDate: date("startDate").notNull(),
  endDate: date("endDate").notNull(),
  status: mysqlEnum("status", ["Active", "Completed", "Draft"]).default("Active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const appraisals = mysqlTable("appraisals", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  cycleId: int("cycleId").notNull(),
  employeeId: int("employeeId").notNull(),
  goalsScore: decimal("goalsScore", { precision: 5, scale: 2 }),
  competencyScore: decimal("competencyScore", { precision: 5, scale: 2 }),
  finalScore: decimal("finalScore", { precision: 5, scale: 2 }),
  comments: text("comments"),
  status: mysqlEnum("status", ["Pending", "Reviewed", "Approved"]).default("Pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

export const assets = mysqlTable("assets", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  assetTag: varchar("assetTag", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 150 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(), // Laptop, Furniture, Vehicle, Equipment
  serialNumber: varchar("serialNumber", { length: 100 }),
  status: mysqlEnum("status", ["Available", "Assigned", "Under Maintenance", "Retired"]).default("Available").notNull(),
  assignedTo: int("assignedTo"), // employeeId
  purchaseDate: date("purchaseDate"),
  purchaseCost: decimal("purchaseCost", { precision: 12, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

/**
 * Loan and SACCO Deductions table for monthly recurring employee payroll deductions.
 */
export const employeeLoans = mysqlTable("employee_loans", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  employeeId: int("employeeId").notNull(),
  loanType: varchar("loanType", { length: 50 }).notNull(), // 'SACCO Principal', 'SACCO Interest', 'Company Advance', 'Welfare'
  totalAmount: decimal("totalAmount", { precision: 12, scale: 2 }).notNull(),
  monthlyDeduction: decimal("monthlyDeduction", { precision: 12, scale: 2 }).notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["Active", "Completed", "Suspended"]).default("Active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));

/**
 * System notification logs table for Email and SMS dispatches.
 */
export const notificationLogs = mysqlTable("notification_logs", {
  id: int("id").autoincrement().primaryKey(),
  tenantId: int("tenantId").notNull(),
  recipientEmail: varchar("recipientEmail", { length: 150 }),
  recipientPhone: varchar("recipientPhone", { length: 50 }),
  channel: mysqlEnum("channel", ["Email", "SMS"]).notNull(),
  subject: varchar("subject", { length: 250 }),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["Sent", "Failed", "Pending"]).default("Sent").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  tenantIdx: index("tenant_idx").on(table.tenantId),
}));
