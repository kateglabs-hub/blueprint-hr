CREATE TABLE `payroll_runs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`payrollPeriodId` int NOT NULL,
	`totalEmployees` int NOT NULL,
	`totalGross` decimal(15,2) NOT NULL,
	`totalPaye` decimal(15,2) NOT NULL,
	`totalNssf` decimal(15,2) NOT NULL,
	`totalShif` decimal(15,2) NOT NULL,
	`totalHousingLevy` decimal(15,2) NOT NULL,
	`totalNet` decimal(15,2) NOT NULL,
	`processedBy` int,
	`status` enum('Draft','Submitted','Approved','Locked') NOT NULL DEFAULT 'Draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payroll_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `payroll_runs` (`tenantId`);