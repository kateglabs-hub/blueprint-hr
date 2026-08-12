# BluePrint HR Phase 1 TODO

- [ ] Define comprehensive multi-tenant and HR database schema (`tenants`, `companies`, `branches`, `departments`, `designations`, `grades`, `employment_types`, `employees`, `audit_logs`, update `users`)
- [ ] Run drizzle-kit generate and apply database migration via SQL execution
- [ ] Seed default tenant, roles, demo users (Super Admin, Company Admin, HR Manager, Payroll Manager, Employee), and sample org data
- [ ] Implement robust tRPC procedures with tenant scoping and role-based authorization for all 5 roles
- [ ] Build audit logging middleware/helper to track create, update, and delete operations across all tenant data
- [ ] Build polished dashboard UI with role-aware metrics, quick actions, and recent activity
- [ ] Build Company & Tenant Setup flow with company registration and tenant onboarding
- [ ] Build Organization Structure management (Branches, Departments, Designations, Grades, Employment Types)
- [ ] Build Employee Master module supporting KRA PIN, NSSF Number, SHIF Number, bank details, and full profile management
- [ ] Build Audit Trail viewer for monitoring system actions
- [ ] Write and execute comprehensive vitest unit tests covering auth, multi-tenant isolation, and employee operations
- [ ] Verify frontend build and prepare for deployment
