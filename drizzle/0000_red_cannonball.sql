CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int,
	`userName` varchar(150),
	`action` varchar(50) NOT NULL,
	`entityType` varchar(100) NOT NULL,
	`entityId` int,
	`details` text,
	`ipAddress` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `branches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(150) NOT NULL,
	`code` varchar(50),
	`location` varchar(150),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `branches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `departments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(150) NOT NULL,
	`code` varchar(50),
	`branchId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `departments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `designations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(150) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `designations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employees` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`employeeNo` varchar(50) NOT NULL,
	`payrollNo` varchar(50),
	`firstName` varchar(100) NOT NULL,
	`middleName` varchar(100),
	`lastName` varchar(100) NOT NULL,
	`gender` varchar(20),
	`dob` date,
	`idNo` varchar(30),
	`kraPin` varchar(30) NOT NULL,
	`nssfNo` varchar(30),
	`shifNo` varchar(30),
	`phone` varchar(30),
	`email` varchar(150),
	`branchId` int,
	`departmentId` int,
	`designationId` int,
	`gradeId` int,
	`employmentTypeId` int,
	`employmentDate` date,
	`terminationDate` date,
	`employmentStatus` varchar(30) NOT NULL DEFAULT 'Active',
	`basicSalary` decimal(12,2) NOT NULL,
	`bankName` varchar(100),
	`bankBranch` varchar(100),
	`accountNumber` varchar(50),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employees_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `employment_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `employment_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `grades` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`level` varchar(50),
	`minSalary` decimal(12,2),
	`maxSalary` decimal(12,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `grades_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(200) NOT NULL,
	`kraPin` varchar(20),
	`email` varchar(150),
	`phone` varchar(50),
	`address` text,
	`subdomain` varchar(100),
	`status` enum('Active','Suspended','Trial') NOT NULL DEFAULT 'Active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_subdomain_unique` UNIQUE(`subdomain`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` int AUTO_INCREMENT NOT NULL,
	`openId` varchar(64) NOT NULL,
	`name` text,
	`email` varchar(320),
	`loginMethod` varchar(64),
	`tenantId` int DEFAULT 1,
	`role` enum('Super Admin','Company Admin','HR Manager','Payroll Manager','Employee','user','admin') NOT NULL DEFAULT 'Employee',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastSignedIn` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `audit_logs` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `branches` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `departments` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `designations` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `employees` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `employment_types` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `grades` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `users` (`tenantId`);