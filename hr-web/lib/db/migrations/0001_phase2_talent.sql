CREATE TABLE "employee_performance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"period_year" integer NOT NULL,
	"period_quarter" integer,
	"period_label" text,
	"kpi_id" uuid NOT NULL,
	"target_value" double precision,
	"actual_value" double precision,
	"score" double precision,
	"weight" double precision DEFAULT 1 NOT NULL,
	"manager_comments" text,
	"employee_comments" text,
	"status" text DEFAULT 'draft' NOT NULL,
	"line_manager_id" uuid,
	"line_manager_decided_at" timestamp with time zone,
	"hr_id" uuid,
	"hr_decided_at" timestamp with time zone,
	"exco_decided_at" timestamp with time zone,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "kpi_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "kpis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"description" text,
	"unit" text,
	"target_direction" text DEFAULT 'higher_better' NOT NULL,
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
CREATE TABLE "employee_jds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"jd_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone NOT NULL,
	"line_manager_id" uuid,
	"hr_id" uuid,
	"ceo_approved_at" timestamp with time zone,
	"status" text DEFAULT 'assigned' NOT NULL,
	"notes" text,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "jd_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jd_id" uuid NOT NULL,
	"section" text NOT NULL,
	"body" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "jd_kpis" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jd_id" uuid NOT NULL,
	"kpi_id" uuid,
	"target" text,
	"weight" double precision DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "jd_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jd_id" uuid NOT NULL,
	"description" text NOT NULL,
	"weight" double precision DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "jd_training_external" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jd_id" uuid NOT NULL,
	"training_id" uuid,
	"required" boolean DEFAULT false NOT NULL,
	"frequency" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "jd_training_internal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"jd_id" uuid NOT NULL,
	"training_id" uuid,
	"required" boolean DEFAULT false NOT NULL,
	"frequency" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "job_descriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"summary" text,
	"reports_to_title" text,
	"prepared_by" uuid,
	"approved_by_ceo_at" timestamp with time zone,
	"effective_date" timestamp with time zone,
	"retired_date" timestamp with time zone,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "analysis_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"training_internal_id" uuid,
	"training_external_id" uuid,
	"employee_id" uuid NOT NULL,
	"booking_complete" boolean DEFAULT false NOT NULL,
	"approval_complete" boolean DEFAULT false NOT NULL,
	"po_complete" boolean DEFAULT false NOT NULL,
	"start_complete" boolean DEFAULT false NOT NULL,
	"end_complete" boolean DEFAULT false NOT NULL,
	"certificate_complete" boolean DEFAULT false NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "employee_tests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"training_internal_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"score" double precision,
	"percentage" double precision,
	"passed" boolean,
	"responses_json" text,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "quiz_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"answer_text" text NOT NULL,
	"is_correct" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"training_id" uuid NOT NULL,
	"question" text NOT NULL,
	"kind" text DEFAULT 'single_choice' NOT NULL,
	"points" double precision DEFAULT 1 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"explanation" text,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "training_external" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"training_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"provider_name" text NOT NULL,
	"venue" text,
	"scheduled_date" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"score" double precision,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"certificate_path" text,
	"po_number" text,
	"cost" double precision,
	"approval_status" text DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"notes" text,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "training_internal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"training_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"scheduled_date" timestamp with time zone,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"score" double precision,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"certificate_path" text,
	"approval_status" text DEFAULT 'pending' NOT NULL,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"notes" text,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "trainings_catalogue" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"provider" text,
	"duration_hours" double precision,
	"cost" double precision,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"requires_quiz" boolean DEFAULT false NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "employee_performance" ADD CONSTRAINT "employee_performance_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_performance" ADD CONSTRAINT "employee_performance_kpi_id_kpis_id_fk" FOREIGN KEY ("kpi_id") REFERENCES "public"."kpis"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_category_id_kpi_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."kpi_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_jds" ADD CONSTRAINT "employee_jds_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_jds" ADD CONSTRAINT "employee_jds_jd_id_job_descriptions_id_fk" FOREIGN KEY ("jd_id") REFERENCES "public"."job_descriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jd_entries" ADD CONSTRAINT "jd_entries_jd_id_job_descriptions_id_fk" FOREIGN KEY ("jd_id") REFERENCES "public"."job_descriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jd_kpis" ADD CONSTRAINT "jd_kpis_jd_id_job_descriptions_id_fk" FOREIGN KEY ("jd_id") REFERENCES "public"."job_descriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jd_roles" ADD CONSTRAINT "jd_roles_jd_id_job_descriptions_id_fk" FOREIGN KEY ("jd_id") REFERENCES "public"."job_descriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jd_training_external" ADD CONSTRAINT "jd_training_external_jd_id_job_descriptions_id_fk" FOREIGN KEY ("jd_id") REFERENCES "public"."job_descriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jd_training_internal" ADD CONSTRAINT "jd_training_internal_jd_id_job_descriptions_id_fk" FOREIGN KEY ("jd_id") REFERENCES "public"."job_descriptions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analysis_skills" ADD CONSTRAINT "analysis_skills_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_tests" ADD CONSTRAINT "employee_tests_training_internal_id_training_internal_id_fk" FOREIGN KEY ("training_internal_id") REFERENCES "public"."training_internal"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_tests" ADD CONSTRAINT "employee_tests_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD CONSTRAINT "quiz_answers_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_questions" ADD CONSTRAINT "quiz_questions_training_id_trainings_catalogue_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."trainings_catalogue"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_external" ADD CONSTRAINT "training_external_training_id_trainings_catalogue_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."trainings_catalogue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_external" ADD CONSTRAINT "training_external_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_internal" ADD CONSTRAINT "training_internal_training_id_trainings_catalogue_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."trainings_catalogue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_internal" ADD CONSTRAINT "training_internal_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_performance_employee_period_idx" ON "employee_performance" USING btree ("employee_id","period_year","period_quarter");--> statement-breakpoint
CREATE INDEX "employee_performance_status_idx" ON "employee_performance" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "kpi_categories_name_unique" ON "kpi_categories" USING btree ("name");--> statement-breakpoint
CREATE INDEX "kpis_category_idx" ON "kpis" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "kpis_name_unique" ON "kpis" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "employee_jds_employee_jd_unique" ON "employee_jds" USING btree ("employee_id","jd_id");--> statement-breakpoint
CREATE INDEX "employee_jds_employee_idx" ON "employee_jds" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "jd_entries_jd_idx" ON "jd_entries" USING btree ("jd_id");--> statement-breakpoint
CREATE INDEX "jd_kpis_jd_idx" ON "jd_kpis" USING btree ("jd_id");--> statement-breakpoint
CREATE INDEX "jd_roles_jd_idx" ON "jd_roles" USING btree ("jd_id");--> statement-breakpoint
CREATE INDEX "jd_training_external_jd_idx" ON "jd_training_external" USING btree ("jd_id");--> statement-breakpoint
CREATE INDEX "jd_training_internal_jd_idx" ON "jd_training_internal" USING btree ("jd_id");--> statement-breakpoint
CREATE UNIQUE INDEX "job_descriptions_title_version_unique" ON "job_descriptions" USING btree ("title","version");--> statement-breakpoint
CREATE INDEX "job_descriptions_status_idx" ON "job_descriptions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "analysis_skills_employee_idx" ON "analysis_skills" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_tests_employee_idx" ON "employee_tests" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "quiz_answers_question_idx" ON "quiz_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "quiz_questions_training_idx" ON "quiz_questions" USING btree ("training_id");--> statement-breakpoint
CREATE INDEX "training_external_employee_idx" ON "training_external" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "training_external_status_idx" ON "training_external" USING btree ("status");--> statement-breakpoint
CREATE INDEX "training_internal_employee_idx" ON "training_internal" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "training_internal_status_idx" ON "training_internal" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "trainings_catalogue_name_unique" ON "trainings_catalogue" USING btree ("name");