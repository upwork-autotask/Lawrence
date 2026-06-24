CREATE TABLE "employee_take_ons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_name" text,
	"first_name" text NOT NULL,
	"surname" text NOT NULL,
	"id_number" text,
	"date_engaged" timestamp with time zone,
	"cell_number" text,
	"region_id" uuid,
	"department_id" uuid,
	"job_title_id" uuid,
	"emergency_contact" text,
	"emergency_cell" text,
	"unit_number" text,
	"street_number" text,
	"street_name" text,
	"complex" text,
	"suburb" text,
	"city" text,
	"doc_id_card" boolean DEFAULT false NOT NULL,
	"doc_driving_license" boolean DEFAULT false NOT NULL,
	"doc_criminal_check" boolean DEFAULT false NOT NULL,
	"doc_sage_form" boolean DEFAULT false NOT NULL,
	"doc_bank_confirmation" boolean DEFAULT false NOT NULL,
	"doc_sars_reg" boolean DEFAULT false NOT NULL,
	"doc_contract_of_emp" boolean DEFAULT false NOT NULL,
	"doc_prdp" boolean DEFAULT false NOT NULL,
	"doc_medical" boolean DEFAULT false NOT NULL,
	"doc_work_permit" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp with time zone,
	"employee_id" uuid,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "employee_take_ons" ADD CONSTRAINT "employee_take_ons_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_take_ons" ADD CONSTRAINT "employee_take_ons_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employee_take_ons" ADD CONSTRAINT "employee_take_ons_job_title_id_job_titles_id_fk" FOREIGN KEY ("job_title_id") REFERENCES "public"."job_titles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employee_take_ons_status_idx" ON "employee_take_ons" USING btree ("status");