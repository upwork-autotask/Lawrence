CREATE TABLE "actual_recruitment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"due_date" timestamp with time zone,
	"region_id" uuid,
	"department_id" uuid,
	"name" text,
	"surname" text,
	"company_no" text,
	"job_title" text,
	"occupational_level" text,
	"employment_type" text,
	"gender" text,
	"race" text,
	"value" integer DEFAULT 1 NOT NULL,
	"reason_for_appointment" text,
	"responsible_executive" text,
	"responsible_manager" text,
	"progress_status" text,
	"reason" text,
	"non_ee" boolean DEFAULT false NOT NULL,
	"approval" text,
	"non_recruitment_reason_id" uuid,
	"supporting_document" text,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "recruitment_targets" ADD COLUMN "due_date" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "recruitment_targets" ADD COLUMN "occupational_level" text;--> statement-breakpoint
ALTER TABLE "recruitment_targets" ADD COLUMN "employment_type" text;--> statement-breakpoint
ALTER TABLE "recruitment_targets" ADD COLUMN "gender" text;--> statement-breakpoint
ALTER TABLE "recruitment_targets" ADD COLUMN "race" text;--> statement-breakpoint
ALTER TABLE "actual_recruitment" ADD CONSTRAINT "actual_recruitment_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actual_recruitment" ADD CONSTRAINT "actual_recruitment_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "actual_recruitment" ADD CONSTRAINT "actual_recruitment_non_recruitment_reason_id_non_recruitment_reasons_id_fk" FOREIGN KEY ("non_recruitment_reason_id") REFERENCES "public"."non_recruitment_reasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "actual_recruitment_due_idx" ON "actual_recruitment" USING btree ("due_date");