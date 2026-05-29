CREATE TABLE `leave_balances` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`leave_type_id` integer NOT NULL,
	`year` integer NOT NULL,
	`allocated` real DEFAULT 0 NOT NULL,
	`taken` real DEFAULT 0 NOT NULL,
	`pending` real DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leave_balances_employee_type_year_unique` ON `leave_balances` (`employee_id`,`leave_type_id`,`year`);--> statement-breakpoint
CREATE TABLE `leave_forms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`leave_type_id` integer NOT NULL,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`days_requested` real NOT NULL,
	`reason` text,
	`attachment_path` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`line_manager_id` integer,
	`line_manager_decided_at` integer,
	`line_manager_status` text DEFAULT 'pending' NOT NULL,
	`line_manager_comments` text,
	`hr_id` integer,
	`hr_decided_at` integer,
	`hr_status` text DEFAULT 'pending' NOT NULL,
	`hr_comments` text,
	`email_status` text DEFAULT 'pending' NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`leave_type_id`) REFERENCES `leave_types`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`line_manager_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`hr_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `leave_forms_employee_idx` ON `leave_forms` (`employee_id`);--> statement-breakpoint
CREATE INDEX `leave_forms_status_idx` ON `leave_forms` (`status`);--> statement-breakpoint
CREATE TABLE `leave_types` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`default_days` real DEFAULT 0 NOT NULL,
	`requires_attachment` integer DEFAULT false NOT NULL,
	`accrual_per_month` real DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `leave_types_name_unique` ON `leave_types` (`name`);--> statement-breakpoint
CREATE TABLE `criminal_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`case_id` integer NOT NULL,
	`reported_to` text NOT NULL,
	`report_number` text,
	`reported_date` integer NOT NULL,
	`status` text,
	`notes` text,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`case_id`) REFERENCES `disciplinary_cases`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `criminal_reports_case_idx` ON `criminal_reports` (`case_id`);--> statement-breakpoint
CREATE TABLE `disciplinary_actions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `disciplinary_actions_name_unique` ON `disciplinary_actions` (`name`);--> statement-breakpoint
CREATE TABLE `disciplinary_cases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`case_number` text NOT NULL,
	`employee_id` integer NOT NULL,
	`offence_id` integer NOT NULL,
	`action_id` integer,
	`incident_date` integer NOT NULL,
	`reported_date` integer NOT NULL,
	`reported_by` integer,
	`description` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`hearing_date` integer,
	`outcome` text,
	`witnesses` text,
	`evidence_path` text,
	`criminal_referral` integer DEFAULT 0 NOT NULL,
	`closed_date` integer,
	`closed_by` integer,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`offence_id`) REFERENCES `nature_of_offence`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`action_id`) REFERENCES `disciplinary_actions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `disciplinary_cases_case_number_unique` ON `disciplinary_cases` (`case_number`);--> statement-breakpoint
CREATE INDEX `disciplinary_cases_employee_idx` ON `disciplinary_cases` (`employee_id`);--> statement-breakpoint
CREATE INDEX `disciplinary_cases_status_idx` ON `disciplinary_cases` (`status`);--> statement-breakpoint
CREATE TABLE `nature_of_offence` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text,
	`name` text NOT NULL,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `nature_of_offence_name_unique` ON `nature_of_offence` (`name`);