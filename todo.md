# BluePrint HR Phase 2 TODO

- [x] Extend database schema with payroll periods, payroll runs, statutory rate tables, leave types, balances, requests, and notifications
- [x] Seed Kenyan statutory rates and leave types
- [x] Implement payroll period status transition mutations in tRPC router
- [x] Add unit tests for DB-driven statutory payroll calculations
- [x] Implement leave accrual/carry-forward logic and calendar query
- [x] Implement ESS profile update and real payslip/P9 export generation
- [x] Ensure robust database schema initialization before seeding
- [x] Execute test suite and verify deployed application accessibility
- [x] Fix production admin login: verify and seed admin@blueprinthr.co.ke with a valid password hash, harden seed repair behavior, test login, and deploy the correction.
