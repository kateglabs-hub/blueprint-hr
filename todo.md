# BluePrint HR Phase 1 TODO

- [x] Define comprehensive multi-tenant and HR database schema (`tenants`, `companies`, `branches`, `departments`, `designations`, `grades`, `employment_types`, `employees`, `audit_logs`, update `users`)
- [x] Run drizzle-kit generate and apply database migration via SQL execution
- [x] Seed default tenant, roles, demo users (Super Admin, Company Admin, HR Manager, Payroll Manager, Employee), and sample org data
- [x] Implement robust tRPC procedures with tenant scoping and role-based authorization for all 5 roles
- [x] Build audit logging middleware/helper to track create, update, and delete operations across all tenant data
- [x] Build polished dashboard UI with role-aware metrics, quick actions, and recent activity
- [x] Build Company & Tenant Setup flow with company registration and tenant onboarding
- [x] Build Organization Structure management (Branches, Departments, Designations, Grades, Employment Types)
- [x] Build Employee Master module supporting KRA PIN, NSSF Number, SHIF Number, bank details, and full profile management
- [x] Build Audit Trail viewer for monitoring system actions
- [x] Write and execute comprehensive vitest unit tests covering auth, multi-tenant isolation, and employee operations
- [x] Verify frontend build and prepare for deployment

# BluePrint HR Phase 2 TODO

- [ ] Extend database schema with payroll periods, payroll runs, statutory rate tables, leave types, balances, requests, and notifications
- [ ] Seed Kenyan statutory rates (PAYE bands & relief, NSSF Tier I/II, SHIF rates, Housing Levy) and leave types
- [ ] Implement Kenyan statutory payroll engine (gross pay, PAYE with personal relief, NSSF, SHIF, Housing Levy, net pay)
- [ ] Implement payroll cycle workflows (open period, compute run, approve, lock, generate payslips and P9 data)
- [ ] Implement leave management module (balances, accruals, carry-forward, requests, approvals, calendar, notifications)
- [ ] Implement Employee Self-Service (ESS) portal (view/download payslips and P9, view leave balances, apply for leave, update profile)
- [ ] Build role-aware frontend UI for payroll processing, leave management, and ESS portal
- [ ] Verify test suite, save checkpoint, and deploy Phase 2
