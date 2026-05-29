CREATE TABLE `role_permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`role_id` integer NOT NULL,
	`permission` text NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `role_permissions_role_perm_unique` ON `role_permissions` (`role_id`,`permission`);--> statement-breakpoint
CREATE TABLE `roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`is_system` integer DEFAULT false NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roles_name_unique` ON `roles` (`name`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `user_roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`role_id` integer NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_roles_user_role_unique` ON `user_roles` (`user_id`,`role_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`email` text,
	`full_name` text NOT NULL,
	`password_hash` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`employee_id` integer,
	`last_login_at` integer,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `departments` (
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
CREATE UNIQUE INDEX `departments_name_unique` ON `departments` (`name`);--> statement-breakpoint
CREATE TABLE `depots` (
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
CREATE UNIQUE INDEX `depots_name_unique` ON `depots` (`name`);--> statement-breakpoint
CREATE TABLE `ee_groups` (
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
CREATE UNIQUE INDEX `ee_groups_name_unique` ON `ee_groups` (`name`);--> statement-breakpoint
CREATE TABLE `job_titles` (
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
CREATE UNIQUE INDEX `job_titles_name_unique` ON `job_titles` (`name`);--> statement-breakpoint
CREATE TABLE `nbc_councils` (
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
CREATE UNIQUE INDEX `nbc_councils_name_unique` ON `nbc_councils` (`name`);--> statement-breakpoint
CREATE TABLE `paterson_grades` (
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
CREATE UNIQUE INDEX `paterson_grades_name_unique` ON `paterson_grades` (`name`);--> statement-breakpoint
CREATE TABLE `regions` (
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
CREATE UNIQUE INDEX `regions_name_unique` ON `regions` (`name`);--> statement-breakpoint
CREATE TABLE `tax_statuses` (
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
CREATE UNIQUE INDEX `tax_statuses_name_unique` ON `tax_statuses` (`name`);--> statement-breakpoint
CREATE TABLE `tiers` (
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
CREATE UNIQUE INDEX `tiers_name_unique` ON `tiers` (`name`);--> statement-breakpoint
CREATE TABLE `employee_attachments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`kind` text NOT NULL,
	`path` text NOT NULL,
	`original_name` text NOT NULL,
	`mime` text,
	`size_bytes` integer,
	`notes` text,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `employee_attachments_employee_idx` ON `employee_attachments` (`employee_id`);--> statement-breakpoint
CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_number` text NOT NULL,
	`first_name` text NOT NULL,
	`surname` text NOT NULL,
	`middle_names` text,
	`known_as` text,
	`email` text,
	`phone_mobile` text,
	`phone_home` text,
	`id_number` text,
	`date_of_birth` integer,
	`gender` text,
	`marital_status` text,
	`nationality` text,
	`ethnicity` text,
	`physical_address` text,
	`postal_address` text,
	`hire_date` integer,
	`termination_date` integer,
	`employment_status` text DEFAULT 'active' NOT NULL,
	`contract_type` text,
	`region_id` integer,
	`department_id` integer,
	`job_title_id` integer,
	`depot_id` integer,
	`tier_id` integer,
	`paterson_grade_id` integer,
	`ee_group_id` integer,
	`nbc_council_id` integer,
	`tax_status_id` integer,
	`line_manager_id` integer,
	`notes` text,
	`photo_path` text,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`job_title_id`) REFERENCES `job_titles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`depot_id`) REFERENCES `depots`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tier_id`) REFERENCES `tiers`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`paterson_grade_id`) REFERENCES `paterson_grades`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`ee_group_id`) REFERENCES `ee_groups`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`nbc_council_id`) REFERENCES `nbc_councils`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tax_status_id`) REFERENCES `tax_statuses`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_employee_number_unique` ON `employees` (`employee_number`);--> statement-breakpoint
CREATE INDEX `employees_line_manager_idx` ON `employees` (`line_manager_id`);--> statement-breakpoint
CREATE INDEX `employees_employment_status_idx` ON `employees` (`employment_status`);--> statement-breakpoint
CREATE TABLE `sync_clock` (
	`id` integer PRIMARY KEY NOT NULL,
	`lamport` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_conflicts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`outbox_id` integer NOT NULL,
	`entity` text NOT NULL,
	`entity_id` integer NOT NULL,
	`local_payload` text NOT NULL,
	`remote_payload` text NOT NULL,
	`resolved_at` integer,
	`resolution` text,
	`resolved_by` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sync_outbox` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity` text NOT NULL,
	`entity_id` integer NOT NULL,
	`op` text NOT NULL,
	`payload_json` text NOT NULL,
	`base_version` integer NOT NULL,
	`lamport` integer NOT NULL,
	`user_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`acknowledged_at` integer,
	`rejection_reason` text
);
--> statement-breakpoint
CREATE INDEX `sync_outbox_status_idx` ON `sync_outbox` (`status`);--> statement-breakpoint
CREATE INDEX `sync_outbox_entity_idx` ON `sync_outbox` (`entity`,`entity_id`);--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`entity_id` integer,
	`before_json` text,
	`after_json` text,
	`ip_address` text,
	`at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_log_entity_idx` ON `audit_log` (`entity`,`entity_id`);--> statement-breakpoint
CREATE INDEX `audit_log_user_idx` ON `audit_log` (`user_id`);--> statement-breakpoint
CREATE INDEX `audit_log_at_idx` ON `audit_log` (`at`);--> statement-breakpoint
CREATE TABLE `email_outbox` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`to_addr` text NOT NULL,
	`cc_addr` text,
	`subject` text NOT NULL,
	`body_html` text NOT NULL,
	`body_text` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`last_error` text,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`sent_at` integer
);
--> statement-breakpoint
CREATE INDEX `email_outbox_status_idx` ON `email_outbox` (`status`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`kind` text NOT NULL,
	`title` text NOT NULL,
	`body` text,
	`link` text,
	`payload_json` text,
	`read_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE INDEX `notifications_unread_idx` ON `notifications` (`user_id`,`read_at`);--> statement-breakpoint
CREATE TABLE `org_settings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`key` text NOT NULL,
	`value` text,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `org_settings_key_unique` ON `org_settings` (`key`);