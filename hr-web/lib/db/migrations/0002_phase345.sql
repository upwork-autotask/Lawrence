CREATE TABLE "dev_experience" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"experience_type" text NOT NULL,
	"description" text,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"mentor_id" uuid,
	"status" text DEFAULT 'planned' NOT NULL,
	"outcome" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "development_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"plan_year" integer NOT NULL,
	"summary" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"line_manager_id" uuid,
	"line_manager_decided_at" timestamp with time zone,
	"line_manager_status" text DEFAULT 'pending' NOT NULL,
	"line_manager_comments" text,
	"hr_id" uuid,
	"hr_decided_at" timestamp with time zone,
	"hr_status" text DEFAULT 'pending' NOT NULL,
	"hr_comments" text,
	"compliance_id" uuid,
	"compliance_decided_at" timestamp with time zone,
	"compliance_status" text DEFAULT 'pending' NOT NULL,
	"compliance_comments" text,
	"exco_id" uuid,
	"exco_decided_at" timestamp with time zone,
	"exco_status" text DEFAULT 'pending' NOT NULL,
	"exco_comments" text,
	"target_completion_date" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "qual_dev" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"qualification_name" text NOT NULL,
	"institution" text,
	"start_date" timestamp with time zone,
	"target_completion_date" timestamp with time zone,
	"completion_date" timestamp with time zone,
	"status" text DEFAULT 'planned' NOT NULL,
	"cost" double precision,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "skills_dev" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"skill_name" text NOT NULL,
	"category" text,
	"current_level" integer DEFAULT 1 NOT NULL,
	"target_level" integer DEFAULT 3 NOT NULL,
	"evidence" text,
	"status" text DEFAULT 'planned' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "critical_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"incumbent_employee_id" uuid,
	"scheme_id" uuid,
	"risk_level" text DEFAULT 'medium' NOT NULL,
	"impact" text,
	"reason" text,
	"status" text DEFAULT 'open' NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "critical_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"critical_role_id" uuid NOT NULL,
	"skill_name" text NOT NULL,
	"importance" text DEFAULT 'important' NOT NULL,
	"notes" text,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "succession_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"critical_role_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"readiness" text DEFAULT '1_2_years' NOT NULL,
	"performance_rating" text,
	"potential_rating" text,
	"development_needs" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'identified' NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "succession_commitments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"commitment" text NOT NULL,
	"due_date" timestamp with time zone,
	"status" text DEFAULT 'pending' NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "succession_schemes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"surname" text NOT NULL,
	"email" text,
	"phone" text,
	"id_number" text,
	"ee_group_id" uuid,
	"source" text,
	"cv_path" text,
	"status" text DEFAULT 'applied' NOT NULL,
	"rejection_reason_id" uuid,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"evaluator_employee_id" uuid,
	"score" double precision,
	"max_score" double precision DEFAULT 100 NOT NULL,
	"strengths" text,
	"weaknesses" text,
	"recommendation" text,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "interview_leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"role_on_panel" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"notes" text,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"candidate_id" uuid NOT NULL,
	"scheduled_at" timestamp with time zone,
	"venue" text,
	"stage" text DEFAULT 'first' NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "non_recruitment_reasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "recruitment_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_number" text,
	"position_title" text NOT NULL,
	"job_title_id" uuid,
	"department_id" uuid,
	"region_id" uuid,
	"headcount" integer DEFAULT 1 NOT NULL,
	"motivation" text,
	"employment_type" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"manager_id" uuid,
	"manager_status" text DEFAULT 'pending' NOT NULL,
	"hr_id" uuid,
	"hr_status" text DEFAULT 'pending' NOT NULL,
	"target_start_date" timestamp with time zone,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "recruitment_targets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ee_group_id" uuid,
	"period_year" integer NOT NULL,
	"target_count" integer DEFAULT 0 NOT NULL,
	"achieved_count" integer DEFAULT 0 NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "car_scheme" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"registration" text,
	"make_model" text,
	"year" text,
	"monthly_allowance" double precision,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"notes" text,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "expense_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"claim_number" text,
	"employee_id" uuid NOT NULL,
	"category_id" uuid,
	"expense_date" timestamp with time zone NOT NULL,
	"amount" double precision NOT NULL,
	"currency" text DEFAULT 'ZAR' NOT NULL,
	"description" text,
	"receipt_path" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"manager_id" uuid,
	"manager_decided_at" timestamp with time zone,
	"manager_status" text DEFAULT 'pending' NOT NULL,
	"finance_id" uuid,
	"finance_decided_at" timestamp with time zone,
	"finance_status" text DEFAULT 'pending' NOT NULL,
	"reimbursed_at" timestamp with time zone,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "exit_reasons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "exit_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"exit_type" text DEFAULT 'resignation' NOT NULL,
	"reason_id" uuid,
	"notice_date" timestamp with time zone,
	"last_working_day" timestamp with time zone,
	"interview_date" timestamp with time zone,
	"interviewer_id" uuid,
	"interview_notes" text,
	"rehire_eligible" boolean,
	"assets_returned" boolean DEFAULT false NOT NULL,
	"final_settlement_paid" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'initiated' NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "org_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "dev_experience" ADD CONSTRAINT "dev_experience_plan_id_development_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."development_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "development_plans" ADD CONSTRAINT "development_plans_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qual_dev" ADD CONSTRAINT "qual_dev_plan_id_development_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."development_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills_dev" ADD CONSTRAINT "skills_dev_plan_id_development_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."development_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "critical_roles" ADD CONSTRAINT "critical_roles_incumbent_employee_id_employees_id_fk" FOREIGN KEY ("incumbent_employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "critical_roles" ADD CONSTRAINT "critical_roles_scheme_id_succession_schemes_id_fk" FOREIGN KEY ("scheme_id") REFERENCES "public"."succession_schemes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "critical_skills" ADD CONSTRAINT "critical_skills_critical_role_id_critical_roles_id_fk" FOREIGN KEY ("critical_role_id") REFERENCES "public"."critical_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "succession_candidates" ADD CONSTRAINT "succession_candidates_critical_role_id_critical_roles_id_fk" FOREIGN KEY ("critical_role_id") REFERENCES "public"."critical_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "succession_candidates" ADD CONSTRAINT "succession_candidates_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "succession_commitments" ADD CONSTRAINT "succession_commitments_candidate_id_succession_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."succession_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_request_id_recruitment_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."recruitment_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_ee_group_id_ee_groups_id_fk" FOREIGN KEY ("ee_group_id") REFERENCES "public"."ee_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_rejection_reason_id_non_recruitment_reasons_id_fk" FOREIGN KEY ("rejection_reason_id") REFERENCES "public"."non_recruitment_reasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_leads" ADD CONSTRAINT "interview_leads_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_leads" ADD CONSTRAINT "interview_leads_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_request_id_recruitment_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."recruitment_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_requests" ADD CONSTRAINT "recruitment_requests_job_title_id_job_titles_id_fk" FOREIGN KEY ("job_title_id") REFERENCES "public"."job_titles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_requests" ADD CONSTRAINT "recruitment_requests_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_requests" ADD CONSTRAINT "recruitment_requests_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recruitment_targets" ADD CONSTRAINT "recruitment_targets_ee_group_id_ee_groups_id_fk" FOREIGN KEY ("ee_group_id") REFERENCES "public"."ee_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_scheme" ADD CONSTRAINT "car_scheme_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_category_id_expense_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."expense_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exit_records" ADD CONSTRAINT "exit_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exit_records" ADD CONSTRAINT "exit_records_reason_id_exit_reasons_id_fk" FOREIGN KEY ("reason_id") REFERENCES "public"."exit_reasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "dev_experience_plan_idx" ON "dev_experience" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "development_plans_employee_year_idx" ON "development_plans" USING btree ("employee_id","plan_year");--> statement-breakpoint
CREATE INDEX "development_plans_status_idx" ON "development_plans" USING btree ("status");--> statement-breakpoint
CREATE INDEX "qual_dev_plan_idx" ON "qual_dev" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "skills_dev_plan_idx" ON "skills_dev" USING btree ("plan_id");--> statement-breakpoint
CREATE INDEX "critical_roles_incumbent_idx" ON "critical_roles" USING btree ("incumbent_employee_id");--> statement-breakpoint
CREATE INDEX "critical_skills_role_idx" ON "critical_skills" USING btree ("critical_role_id");--> statement-breakpoint
CREATE INDEX "succession_candidates_role_idx" ON "succession_candidates" USING btree ("critical_role_id");--> statement-breakpoint
CREATE INDEX "succession_commitments_candidate_idx" ON "succession_commitments" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "candidates_request_idx" ON "candidates" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "evaluations_interview_idx" ON "evaluations" USING btree ("interview_id");--> statement-breakpoint
CREATE UNIQUE INDEX "interview_leads_interview_employee_unique" ON "interview_leads" USING btree ("interview_id","employee_id");--> statement-breakpoint
CREATE INDEX "interviews_candidate_idx" ON "interviews" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "recruitment_requests_status_idx" ON "recruitment_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "recruitment_targets_period_idx" ON "recruitment_targets" USING btree ("period_year");--> statement-breakpoint
CREATE INDEX "car_scheme_employee_idx" ON "car_scheme" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "expenses_employee_idx" ON "expenses" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "expenses_status_idx" ON "expenses" USING btree ("status");--> statement-breakpoint
CREATE INDEX "exit_records_employee_idx" ON "exit_records" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "exit_records_status_idx" ON "exit_records" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "org_settings_key_unique" ON "org_settings" USING btree ("key");