CREATE TABLE `housing_levy_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`employeePercentage` decimal(5,4) NOT NULL,
	`employerPercentage` decimal(5,4) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `housing_levy_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leave_balances` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`employeeId` int NOT NULL,
	`leaveTypeId` int NOT NULL,
	`year` int NOT NULL,
	`allocatedDays` decimal(5,2) NOT NULL,
	`usedDays` decimal(5,2) NOT NULL DEFAULT '0.00',
	`carriedForward` decimal(5,2) NOT NULL DEFAULT '0.00',
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leave_balances_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leave_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`employeeId` int NOT NULL,
	`leaveTypeId` int NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`daysRequested` decimal(5,2) NOT NULL,
	`reason` text NOT NULL,
	`status` enum('Pending','Approved','Rejected','Cancelled') NOT NULL DEFAULT 'Pending',
	`approvedBy` int,
	`approvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leave_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leave_types` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`defaultDays` int NOT NULL,
	`paid` enum('Yes','No') NOT NULL DEFAULT 'Yes',
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leave_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(150) NOT NULL,
	`message` text NOT NULL,
	`isRead` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `nssf_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`tierName` varchar(50) NOT NULL,
	`lowerLimit` decimal(10,2) NOT NULL,
	`upperLimit` decimal(10,2) NOT NULL,
	`employeeRate` decimal(5,4) NOT NULL,
	`employerRate` decimal(5,4) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `nssf_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payroll_periods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`month` int NOT NULL,
	`year` int NOT NULL,
	`status` enum('Open','Processing','Approved','Locked') NOT NULL DEFAULT 'Open',
	`processedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payroll_periods_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payroll_transactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`payrollPeriodId` int NOT NULL,
	`employeeId` int NOT NULL,
	`basicSalary` decimal(12,2) NOT NULL,
	`allowances` decimal(12,2) NOT NULL DEFAULT '0.00',
	`grossPay` decimal(12,2) NOT NULL,
	`taxablePay` decimal(12,2) NOT NULL,
	`paye` decimal(12,2) NOT NULL,
	`personalRelief` decimal(12,2) NOT NULL,
	`nssf` decimal(12,2) NOT NULL,
	`shif` decimal(12,2) NOT NULL,
	`housingLevy` decimal(12,2) NOT NULL,
	`otherDeductions` decimal(12,2) NOT NULL DEFAULT '0.00',
	`totalDeductions` decimal(12,2) NOT NULL,
	`netPay` decimal(12,2) NOT NULL,
	`status` enum('Draft','Approved','Paid') NOT NULL DEFAULT 'Draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payroll_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shif_rates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`percentage` decimal(5,4) NOT NULL,
	`minAmount` decimal(10,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shif_rates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tax_brackets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`bandOrder` int NOT NULL,
	`lowerLimit` decimal(12,2) NOT NULL,
	`upperLimit` decimal(12,2),
	`rate` decimal(5,4) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tax_brackets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tax_reliefs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`reliefName` varchar(100) NOT NULL,
	`monthlyAmount` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `tax_reliefs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `housing_levy_rates` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `leave_balances` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `leave_requests` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `leave_types` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `notifications` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `nssf_rates` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `payroll_periods` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `payroll_transactions` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `shif_rates` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `tax_brackets` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `tax_reliefs` (`tenantId`);