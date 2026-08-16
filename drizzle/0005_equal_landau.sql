CREATE TABLE `appraisal_cycles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(150) NOT NULL,
	`startDate` date NOT NULL,
	`endDate` date NOT NULL,
	`status` enum('Active','Completed','Draft') NOT NULL DEFAULT 'Active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `appraisal_cycles_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `appraisals` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`cycleId` int NOT NULL,
	`employeeId` int NOT NULL,
	`goalsScore` decimal(5,2),
	`competencyScore` decimal(5,2),
	`finalScore` decimal(5,2),
	`comments` text,
	`status` enum('Pending','Reviewed','Approved') NOT NULL DEFAULT 'Pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `appraisals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approval_requests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`workflowType` varchar(50) NOT NULL,
	`entityId` int NOT NULL,
	`currentStep` int NOT NULL DEFAULT 1,
	`status` enum('Pending','Approved','Rejected','Escalated') NOT NULL DEFAULT 'Pending',
	`comments` text,
	`submittedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `approval_requests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `approval_workflows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`workflowType` varchar(50) NOT NULL,
	`stepOrder` int NOT NULL,
	`roleRequired` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `approval_workflows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `assets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`assetTag` varchar(50) NOT NULL,
	`name` varchar(150) NOT NULL,
	`category` varchar(100) NOT NULL,
	`serialNumber` varchar(100),
	`status` enum('Available','Assigned','Under Maintenance','Retired') NOT NULL DEFAULT 'Available',
	`assignedTo` int,
	`purchaseDate` date,
	`purchaseCost` decimal(12,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `assets_id` PRIMARY KEY(`id`),
	CONSTRAINT `assets_assetTag_unique` UNIQUE(`assetTag`)
);
--> statement-breakpoint
CREATE TABLE `attendance_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`employeeId` int NOT NULL,
	`logDate` date NOT NULL,
	`clockIn` timestamp,
	`clockOut` timestamp,
	`status` enum('Present','Absent','Late','On Leave','Half Day') NOT NULL DEFAULT 'Present',
	`overtimeHours` decimal(5,2) NOT NULL DEFAULT '0.00',
	`source` varchar(50) NOT NULL DEFAULT 'Biometric Device',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `attendance_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `gl_accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`accountCode` varchar(50) NOT NULL,
	`accountName` varchar(150) NOT NULL,
	`accountType` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `gl_accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_candidates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`vacancyId` int NOT NULL,
	`fullName` varchar(150) NOT NULL,
	`email` varchar(150) NOT NULL,
	`phone` varchar(50) NOT NULL,
	`stage` enum('Applied','Screening','Interview','Offer Extended','Hired','Rejected') NOT NULL DEFAULT 'Applied',
	`score` decimal(5,2),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_candidates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `job_vacancies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`title` varchar(150) NOT NULL,
	`departmentId` int NOT NULL,
	`positions` int NOT NULL DEFAULT 1,
	`status` enum('Open','Closed','Draft') NOT NULL DEFAULT 'Open',
	`description` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `job_vacancies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`referenceNo` varchar(100) NOT NULL,
	`entryDate` date NOT NULL,
	`description` text NOT NULL,
	`totalDebit` decimal(15,2) NOT NULL,
	`totalCredit` decimal(15,2) NOT NULL,
	`status` enum('Draft','Posted','Void') NOT NULL DEFAULT 'Draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `journal_entries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `shifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(100) NOT NULL,
	`startTime` varchar(10) NOT NULL,
	`endTime` varchar(10) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `shifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `appraisal_cycles` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `appraisals` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `approval_requests` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `approval_workflows` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `assets` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `attendance_logs` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `gl_accounts` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `job_candidates` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `job_vacancies` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `journal_entries` (`tenantId`);--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `shifts` (`tenantId`);