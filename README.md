# BluePrint HR SaaS

**BluePrint HR** is an enterprise-grade, multi-tenant Kenya Payroll & Human Resource Management SaaS platform built for Kenyan businesses and compliance requirements.

## Overview

BluePrint HR provides a comprehensive suite of tools designed to streamline HR, payroll, statutory reporting, and enterprise operations under strict multi-tenant isolation and role-based access control.

### Key Modules & Features

1. **Multi-Tenant Architecture**: Strict tenant isolation across all tables via `tenantId`, supporting company registration, branch hierarchies, departments, designations, salary grades, and employment types.
2. **Role-Based Access Control (RBAC)**: Five distinct roles (**Super Admin**, **Company Admin**, **HR Manager**, **Payroll Manager**, **Employee**) with granular permission gating across backend tRPC procedures and UI views.
3. **Kenyan Statutory Payroll Engine**: Automated calculations for PAYE tax bands with personal relief, Tier I & II NSSF contributions, SHIF deductions, and Housing Levy computations, driven by configurable database tax tables.
4. **Leave Management Module**: Leave types (Annual, Sick, Compassionate, Maternity, Paternity, Study), leave balances, accruals, carry-forward rules, leave requests, supervisory approval workflows, and leave calendar tracking.
5. **Employee Self-Service (ESS) Portal**: Employee access to view/download monthly payslips, view leave balances, apply for leave, update personal profiles, and inspect annual P9 tax deduction cards.
6. **Enterprise Hub**:
   - **Maker-Checker Approvals**: Multi-step approval chains with escalations and comment trails.
   - **Accounting Integration**: General ledger account mappings and automated journal entry generation for payroll expenses and statutory liabilities.
   - **Time & Attendance**: Shift management, attendance logging, overtime tracking, public holidays, and biometric device log ingestion.
   - **Recruitment & Onboarding**: Job vacancies, applicant pipelines, interview scorecards, offer letters, and onboarding task lists.
   - **Performance Management**: Appraisal cycles, goal setting, competency scoring, and review tracking.
   - **Asset Management**: Asset categories, tagging, serial numbers, allocations, and returns.
7. **Audit Trail**: Real-time logging of all create, update, and delete actions across tenant entities, capturing user identity, timestamps, and change details.

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui components, Lucide icons, Wouter router, TanStack React Query.
- **Backend**: Express 4, tRPC 11 type-safe API routers.
- **Database**: MySQL / TiDB via Drizzle ORM.
- **Authentication**: Secure password hashing and signed HTTP-only session cookies.

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10+
- MySQL database instance

### Installation & Development

1. Clone the repository:
   ```bash
   git clone https://github.com/georgewamola/blueprint-hr.git
   cd blueprint-hr
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Configure environment variables (`DATABASE_URL`, `JWT_SECRET`, etc.).

4. Run database migrations:
   ```bash
   pnpm drizzle-kit push
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

6. Run tests:
   ```bash
   pnpm test
   ```

## License

MIT License.
