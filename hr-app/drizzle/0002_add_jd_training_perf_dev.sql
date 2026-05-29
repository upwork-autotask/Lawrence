CREATE TABLE `employee_jds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`jd_id` integer NOT NULL,
	`assigned_at` integer NOT NULL,
	`line_manager_id` integer,
	`hr_id` integer,
	`ceo_approved_at` integer,
	`status` text DEFAULT 'assigned' NOT NULL,
	`notes` text,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`jd_id`) REFERENCES `job_descriptions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employee_jds_employee_jd_unique` ON `employee_jds` (`employee_id`,`jd_id`);--> statement-breakpoint
CREATE INDEX `employee_jds_employee_idx` ON `employee_jds` (`employee_id`);--> statement-breakpoint
CREATE TABLE `jd_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`jd_id` integer NOT NULL,
	`section` text NOT NULL,
	`body` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`jd_id`) REFERENCES `job_descriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `jd_entries_jd_idx` ON `jd_entries` (`jd_id`);--> statement-breakpoint
CREATE TABLE `jd_kpis` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`jd_id` integer NOT NULL,
	`kpi_id` integer,
	`target` text,
	`weight` real DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`jd_id`) REFERENCES `job_descriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `jd_kpis_jd_idx` ON `jd_kpis` (`jd_id`);--> statement-breakpoint
CREATE TABLE `jd_roles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`jd_id` integer NOT NULL,
	`description` text NOT NULL,
	`weight` real DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`jd_id`) REFERENCES `job_descriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `jd_roles_jd_idx` ON `jd_roles` (`jd_id`);--> statement-breakpoint
CREATE TABLE `jd_training_external` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`jd_id` integer NOT NULL,
	`training_id` integer,
	`required` integer DEFAULT false NOT NULL,
	`frequency` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`jd_id`) REFERENCES `job_descriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `jd_training_external_jd_idx` ON `jd_training_external` (`jd_id`);--> statement-breakpoint
CREATE TABLE `jd_training_internal` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`jd_id` integer NOT NULL,
	`training_id` integer,
	`required` integer DEFAULT false NOT NULL,
	`frequency` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`jd_id`) REFERENCES `job_descriptions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `jd_training_internal_jd_idx` ON `jd_training_internal` (`jd_id`);--> statement-breakpoint
CREATE TABLE `job_descriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`summary` text,
	`reports_to_title` text,
	`prepared_by` integer,
	`approved_by_ceo_at` integer,
	`effective_date` integer,
	`retired_date` integer,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `job_descriptions_title_version_unique` ON `job_descriptions` (`title`,`version`);--> statement-breakpoint
CREATE INDEX `job_descriptions_status_idx` ON `job_descriptions` (`status`);--> statement-breakpoint
CREATE TABLE `analysis_skills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`training_internal_id` integer,
	`training_external_id` integer,
	`employee_id` integer NOT NULL,
	`booking_complete` integer DEFAULT false NOT NULL,
	`approval_complete` integer DEFAULT false NOT NULL,
	`po_complete` integer DEFAULT false NOT NULL,
	`start_complete` integer DEFAULT false NOT NULL,
	`end_complete` integer DEFAULT false NOT NULL,
	`certificate_complete` integer DEFAULT false NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `analysis_skills_employee_idx` ON `analysis_skills` (`employee_id`);--> statement-breakpoint
CREATE TABLE `employee_tests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`training_internal_id` integer NOT NULL,
	`employee_id` integer NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`score` real,
	`percentage` real,
	`passed` integer,
	`responses_json` text,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`training_internal_id`) REFERENCES `training_internal`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `employee_tests_employee_idx` ON `employee_tests` (`employee_id`);--> statement-breakpoint
CREATE TABLE `quiz_answers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`question_id` integer NOT NULL,
	`answer_text` text NOT NULL,
	`is_correct` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`question_id`) REFERENCES `quiz_questions`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `quiz_answers_question_idx` ON `quiz_answers` (`question_id`);--> statement-breakpoint
CREATE TABLE `quiz_questions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`training_id` integer NOT NULL,
	`question` text NOT NULL,
	`kind` text DEFAULT 'single_choice' NOT NULL,
	`points` real DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`explanation` text,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`training_id`) REFERENCES `trainings_catalogue`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `quiz_questions_training_idx` ON `quiz_questions` (`training_id`);--> statement-breakpoint
CREATE TABLE `training_external` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`training_id` integer NOT NULL,
	`employee_id` integer NOT NULL,
	`provider_name` text NOT NULL,
	`venue` text,
	`scheduled_date` integer,
	`started_at` integer,
	`completed_at` integer,
	`score` real,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`certificate_path` text,
	`po_number` text,
	`cost` real,
	`approval_status` text DEFAULT 'pending' NOT NULL,
	`approved_by` integer,
	`approved_at` integer,
	`notes` text,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`training_id`) REFERENCES `trainings_catalogue`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `training_external_employee_idx` ON `training_external` (`employee_id`);--> statement-breakpoint
CREATE INDEX `training_external_status_idx` ON `training_external` (`status`);--> statement-breakpoint
CREATE TABLE `training_internal` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`training_id` integer NOT NULL,
	`employee_id` integer NOT NULL,
	`scheduled_date` integer,
	`started_at` integer,
	`completed_at` integer,
	`score` real,
	`status` text DEFAULT 'scheduled' NOT NULL,
	`certificate_path` text,
	`approval_status` text DEFAULT 'pending' NOT NULL,
	`approved_by` integer,
	`approved_at` integer,
	`notes` text,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`training_id`) REFERENCES `trainings_catalogue`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `training_internal_employee_idx` ON `training_internal` (`employee_id`);--> statement-breakpoint
CREATE INDEX `training_internal_status_idx` ON `training_internal` (`status`);--> statement-breakpoint
CREATE TABLE `trainings_catalogue` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text,
	`name` text NOT NULL,
	`kind` text NOT NULL,
	`provider` text,
	`duration_hours` real,
	`cost` real,
	`description` text,
	`is_active` integer DEFAULT true NOT NULL,
	`requires_quiz` integer DEFAULT false NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `trainings_catalogue_name_unique` ON `trainings_catalogue` (`name`);--> statement-breakpoint
CREATE TABLE `employee_performance` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`period_year` integer NOT NULL,
	`period_quarter` integer,
	`period_label` text,
	`kpi_id` integer NOT NULL,
	`target_value` real,
	`actual_value` real,
	`score` real,
	`weight` real DEFAULT 1 NOT NULL,
	`manager_comments` text,
	`employee_comments` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`line_manager_id` integer,
	`line_manager_decided_at` integer,
	`hr_id` integer,
	`hr_decided_at` integer,
	`exco_decided_at` integer,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`kpi_id`) REFERENCES `kpis`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `employee_performance_employee_period_idx` ON `employee_performance` (`employee_id`,`period_year`,`period_quarter`);--> statement-breakpoint
CREATE INDEX `employee_performance_status_idx` ON `employee_performance` (`status`);--> statement-breakpoint
CREATE TABLE `kpi_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text,
	`name` text NOT NULL,
	`description` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `kpi_categories_name_unique` ON `kpi_categories` (`name`);--> statement-breakpoint
CREATE TABLE `kpis` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`category_id` integer NOT NULL,
	`code` text,
	`name` text NOT NULL,
	`description` text,
	`unit` text,
	`target_direction` text DEFAULT 'higher_better' NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `kpi_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `kpis_category_idx` ON `kpis` (`category_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `kpis_name_unique` ON `kpis` (`name`);--> statement-breakpoint
CREATE TABLE `dev_experience` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plan_id` integer NOT NULL,
	`experience_type` text NOT NULL,
	`description` text,
	`start_date` integer,
	`end_date` integer,
	`mentor_id` integer,
	`status` text DEFAULT 'planned' NOT NULL,
	`outcome` text,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `development_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `dev_experience_plan_idx` ON `dev_experience` (`plan_id`);--> statement-breakpoint
CREATE TABLE `development_plans` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`employee_id` integer NOT NULL,
	`plan_year` integer NOT NULL,
	`summary` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`line_manager_id` integer,
	`line_manager_decided_at` integer,
	`line_manager_status` text DEFAULT 'pending' NOT NULL,
	`line_manager_comments` text,
	`hr_id` integer,
	`hr_decided_at` integer,
	`hr_status` text DEFAULT 'pending' NOT NULL,
	`hr_comments` text,
	`compliance_id` integer,
	`compliance_decided_at` integer,
	`compliance_status` text DEFAULT 'pending' NOT NULL,
	`compliance_comments` text,
	`exco_id` integer,
	`exco_decided_at` integer,
	`exco_status` text DEFAULT 'pending' NOT NULL,
	`exco_comments` text,
	`target_completion_date` integer,
	`completed_at` integer,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `development_plans_employee_year_idx` ON `development_plans` (`employee_id`,`plan_year`);--> statement-breakpoint
CREATE INDEX `development_plans_status_idx` ON `development_plans` (`status`);--> statement-breakpoint
CREATE TABLE `qual_dev` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plan_id` integer NOT NULL,
	`qualification_name` text NOT NULL,
	`institution` text,
	`start_date` integer,
	`target_completion_date` integer,
	`completion_date` integer,
	`status` text DEFAULT 'planned' NOT NULL,
	`cost` real,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`notes` text,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `development_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `qual_dev_plan_idx` ON `qual_dev` (`plan_id`);--> statement-breakpoint
CREATE TABLE `skills_dev` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`plan_id` integer NOT NULL,
	`skill_name` text NOT NULL,
	`category` text,
	`current_level` integer DEFAULT 1 NOT NULL,
	`target_level` integer DEFAULT 3 NOT NULL,
	`evidence` text,
	`status` text DEFAULT 'planned' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`legacy_id` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`deleted_at` integer,
	`created_by` integer,
	`updated_by` integer,
	`sync_version` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`plan_id`) REFERENCES `development_plans`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `skills_dev_plan_idx` ON `skills_dev` (`plan_id`);