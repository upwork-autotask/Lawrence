CREATE TABLE "quiz_attempt_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"selected_answer_id" uuid,
	"points_awarded" double precision DEFAULT 0 NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quiz_id" uuid,
	"course_id" uuid,
	"employee_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"total_score" double precision DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "employee_training_external" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"training_id" uuid NOT NULL,
	"training_type" text,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "employee_training_internal" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"training_id" uuid NOT NULL,
	"training_type" text,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" text DEFAULT 'assigned' NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "candidate_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"applied_job_title_id" uuid,
	"region_id" uuid,
	"department_id" uuid,
	"application_type" text,
	"gender" text,
	"qualification_relevant" integer,
	"years_experience_field" integer,
	"years_experience_industry" integer,
	"budget_finance_experience" integer,
	"managed_employees" integer,
	"credit_check" integer,
	"ee_group" integer,
	"demographic" integer,
	"meets_ee_policy" integer,
	"computer_literate" integer,
	"sheq_iso_knowledge" integer,
	"hr_skills" integer,
	"highest_qualification" integer,
	"employed_before" integer,
	"ability_to_complete_task" integer,
	"attendance" integer,
	"strengths" text,
	"weaknesses" text,
	"ee_justification" text,
	"other_qualifications" text,
	"companies_worked_for" text,
	"company_name" text,
	"reference_remark" text,
	"home_address" text,
	"phone" text,
	"assessment_report_path" text,
	"assessed_at" timestamp with time zone,
	"total_score" double precision,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "jd_grade_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_title_id" uuid,
	"occupational_level" text,
	"factor" text,
	"assessment" text,
	"justification_from_jd" text,
	"additional_portfolios" text,
	"grade_impact_review" text,
	"recommended_grading" text,
	"notes" text,
	"ceo_approval" text,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "employee_jds" ADD COLUMN "assigned_kpa" text;--> statement-breakpoint
ALTER TABLE "employee_jds" ADD COLUMN "assigned_kpa_jd_entry_id" uuid;--> statement-breakpoint
ALTER TABLE "quiz_answers" ADD COLUMN "points" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "recruited" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "candidates" ADD COLUMN "score" double precision;--> statement-breakpoint
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_attempt_id_quiz_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."quiz_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_question_id_quiz_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."quiz_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempt_answers" ADD CONSTRAINT "quiz_attempt_answers_selected_answer_id_quiz_answers_id_fk" FOREIGN KEY ("selected_answer_id") REFERENCES "public"."quiz_answers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_course_id_trainings_catalogue_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."trainings_catalogue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_training_external" ADD CONSTRAINT "employee_training_external_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_training_external" ADD CONSTRAINT "employee_training_external_training_id_trainings_catalogue_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."trainings_catalogue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_training_internal" ADD CONSTRAINT "employee_training_internal_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_training_internal" ADD CONSTRAINT "employee_training_internal_training_id_trainings_catalogue_id_fk" FOREIGN KEY ("training_id") REFERENCES "public"."trainings_catalogue"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_assessments" ADD CONSTRAINT "candidate_assessments_candidate_id_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_assessments" ADD CONSTRAINT "candidate_assessments_applied_job_title_id_job_titles_id_fk" FOREIGN KEY ("applied_job_title_id") REFERENCES "public"."job_titles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_assessments" ADD CONSTRAINT "candidate_assessments_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_assessments" ADD CONSTRAINT "candidate_assessments_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jd_grade_evaluations" ADD CONSTRAINT "jd_grade_evaluations_job_title_id_job_titles_id_fk" FOREIGN KEY ("job_title_id") REFERENCES "public"."job_titles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "quiz_attempt_answers_attempt_idx" ON "quiz_attempt_answers" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "quiz_attempt_answers_question_idx" ON "quiz_attempt_answers" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_employee_idx" ON "quiz_attempts" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_course_idx" ON "quiz_attempts" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "quiz_attempts_status_idx" ON "quiz_attempts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "employee_training_external_employee_idx" ON "employee_training_external" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_training_external_training_idx" ON "employee_training_external" USING btree ("training_id");--> statement-breakpoint
CREATE INDEX "employee_training_internal_employee_idx" ON "employee_training_internal" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "employee_training_internal_training_idx" ON "employee_training_internal" USING btree ("training_id");--> statement-breakpoint
CREATE INDEX "candidate_assessments_candidate_idx" ON "candidate_assessments" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "jd_grade_evaluations_job_title_idx" ON "jd_grade_evaluations" USING btree ("job_title_id");--> statement-breakpoint
ALTER TABLE "employee_jds" ADD CONSTRAINT "employee_jds_assigned_kpa_jd_entry_id_jd_entries_id_fk" FOREIGN KEY ("assigned_kpa_jd_entry_id") REFERENCES "public"."jd_entries"("id") ON DELETE no action ON UPDATE no action;