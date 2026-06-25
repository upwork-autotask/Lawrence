ALTER TABLE "leave_forms" ADD COLUMN "region_id" uuid;--> statement-breakpoint
ALTER TABLE "leave_forms" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "leave_forms" ADD COLUMN "date_of_engagement" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "leave_forms" ADD COLUMN "total_holidays" double precision;--> statement-breakpoint
ALTER TABLE "leave_forms" ADD COLUMN "approver_id" uuid;--> statement-breakpoint
ALTER TABLE "disciplinary_cases" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "disciplinary_cases" ADD COLUMN "type_of_disciplinary" text;--> statement-breakpoint
ALTER TABLE "disciplinary_cases" ADD COLUMN "who" text;--> statement-breakpoint
ALTER TABLE "disciplinary_cases" ADD COLUMN "date_of_disciplinary" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "disciplinary_cases" ADD COLUMN "date_of_enquiry" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "disciplinary_cases" ADD COLUMN "action_open_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "disciplinary_cases" ADD COLUMN "action_closed_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "employee_performance" ADD COLUMN "title" text;--> statement-breakpoint
ALTER TABLE "employee_performance" ADD COLUMN "pa_set_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "employee_performance" ADD COLUMN "kpi_category" text;--> statement-breakpoint
ALTER TABLE "employee_performance" ADD COLUMN "kpi_notes" text;--> statement-breakpoint
ALTER TABLE "employee_performance" ADD COLUMN "percentage" double precision;--> statement-breakpoint
ALTER TABLE "employee_performance" ADD COLUMN "achievement_status" text;--> statement-breakpoint
ALTER TABLE "employee_performance" ADD COLUMN "review_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "employee_performance" ADD COLUMN "reviewed_by_id" uuid;--> statement-breakpoint
ALTER TABLE "jd_kpis" ADD COLUMN "kpi_label" text;--> statement-breakpoint
ALTER TABLE "job_descriptions" ADD COLUMN "skill_level" text;--> statement-breakpoint
ALTER TABLE "job_descriptions" ADD COLUMN "qualification" text;--> statement-breakpoint
ALTER TABLE "job_descriptions" ADD COLUMN "job_title_id" uuid;--> statement-breakpoint
ALTER TABLE "critical_roles" ADD COLUMN "ref_no" text;--> statement-breakpoint
ALTER TABLE "critical_roles" ADD COLUMN "last_review_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "critical_roles" ADD COLUMN "successor_identified_id" uuid;--> statement-breakpoint
ALTER TABLE "critical_roles" ADD COLUMN "region_id" uuid;--> statement-breakpoint
ALTER TABLE "critical_roles" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "critical_roles" ADD COLUMN "job_title_id" uuid;--> statement-breakpoint
ALTER TABLE "critical_roles" ADD COLUMN "criticality_reason" text;--> statement-breakpoint
ALTER TABLE "critical_roles" ADD COLUMN "tier_selection" text;--> statement-breakpoint
ALTER TABLE "succession_candidates" ADD COLUMN "date_initiated" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "succession_candidates" ADD COLUMN "identified_succession_position" text;--> statement-breakpoint
ALTER TABLE "succession_candidates" ADD COLUMN "line_manager" text;--> statement-breakpoint
ALTER TABLE "succession_candidates" ADD COLUMN "assessment_tier" text;--> statement-breakpoint
ALTER TABLE "succession_candidates" ADD COLUMN "sub_tier" text;--> statement-breakpoint
ALTER TABLE "succession_candidates" ADD COLUMN "focus_area" text;--> statement-breakpoint
ALTER TABLE "succession_candidates" ADD COLUMN "qualification_req" text;--> statement-breakpoint
ALTER TABLE "succession_candidates" ADD COLUMN "experience_req" text;--> statement-breakpoint
ALTER TABLE "succession_candidates" ADD COLUMN "psychological_req" text;--> statement-breakpoint
ALTER TABLE "succession_candidates" ADD COLUMN "cultural_fit_req" text;--> statement-breakpoint
ALTER TABLE "succession_candidates" ADD COLUMN "compliance_req" text;--> statement-breakpoint
ALTER TABLE "succession_candidates" ADD COLUMN "possible_target_plan" text;--> statement-breakpoint
ALTER TABLE "car_scheme" ADD COLUMN "c_month" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "car_scheme" ADD COLUMN "km_start" double precision;--> statement-breakpoint
ALTER TABLE "car_scheme" ADD COLUMN "km_end" double precision;--> statement-breakpoint
ALTER TABLE "car_scheme" ADD COLUMN "total_km" double precision;--> statement-breakpoint
ALTER TABLE "car_scheme" ADD COLUMN "bkm" double precision;--> statement-breakpoint
ALTER TABLE "car_scheme" ADD COLUMN "pkm" double precision;--> statement-breakpoint
ALTER TABLE "car_scheme" ADD COLUMN "rate_per_km" double precision;--> statement-breakpoint
ALTER TABLE "car_scheme" ADD COLUMN "total_amount" double precision;--> statement-breakpoint
ALTER TABLE "car_scheme" ADD COLUMN "region_id" uuid;--> statement-breakpoint
ALTER TABLE "car_scheme" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "region_id" uuid;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "merge" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "accommodation" double precision;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "entertainment" double precision;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "international" double precision;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "sundry" double precision;--> statement-breakpoint
ALTER TABLE "exit_records" ADD COLUMN "region_id" uuid;--> statement-breakpoint
ALTER TABLE "exit_records" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "exit_records" ADD COLUMN "job_title_id" uuid;--> statement-breakpoint
ALTER TABLE "exit_records" ADD COLUMN "occupational_level" text;--> statement-breakpoint
ALTER TABLE "exit_records" ADD COLUMN "reason_code" text;--> statement-breakpoint
ALTER TABLE "leave_forms" ADD CONSTRAINT "leave_forms_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_forms" ADD CONSTRAINT "leave_forms_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_forms" ADD CONSTRAINT "leave_forms_approver_id_employees_id_fk" FOREIGN KEY ("approver_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_descriptions" ADD CONSTRAINT "job_descriptions_job_title_id_job_titles_id_fk" FOREIGN KEY ("job_title_id") REFERENCES "public"."job_titles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "critical_roles" ADD CONSTRAINT "critical_roles_successor_identified_id_employees_id_fk" FOREIGN KEY ("successor_identified_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "critical_roles" ADD CONSTRAINT "critical_roles_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "critical_roles" ADD CONSTRAINT "critical_roles_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "critical_roles" ADD CONSTRAINT "critical_roles_job_title_id_job_titles_id_fk" FOREIGN KEY ("job_title_id") REFERENCES "public"."job_titles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_scheme" ADD CONSTRAINT "car_scheme_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "car_scheme" ADD CONSTRAINT "car_scheme_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exit_records" ADD CONSTRAINT "exit_records_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exit_records" ADD CONSTRAINT "exit_records_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exit_records" ADD CONSTRAINT "exit_records_job_title_id_job_titles_id_fk" FOREIGN KEY ("job_title_id") REFERENCES "public"."job_titles"("id") ON DELETE no action ON UPDATE no action;