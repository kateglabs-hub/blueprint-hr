CREATE TABLE `companies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`companyName` varchar(200) NOT NULL,
	`kraPin` varchar(20),
	`email` varchar(150),
	`phone` varchar(50),
	`address` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `companies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('Super Admin','Company Admin','HR Manager','Payroll Manager','Employee') NOT NULL DEFAULT 'Employee';--> statement-breakpoint
CREATE INDEX `tenant_idx` ON `companies` (`tenantId`);