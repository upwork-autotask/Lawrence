ALTER TABLE "development_plans" ADD COLUMN "date_initiated" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "development_plans" ADD COLUMN "required_standard" text;--> statement-breakpoint
ALTER TABLE "development_plans" ADD COLUMN "current_level" text;--> statement-breakpoint
ALTER TABLE "development_plans" ADD COLUMN "gap_identified" text;--> statement-breakpoint
ALTER TABLE "development_plans" ADD COLUMN "action_required" text;--> statement-breakpoint
ALTER TABLE "development_plans" ADD COLUMN "milestone" text;--> statement-breakpoint
ALTER TABLE "development_plans" ADD COLUMN "measurement_criteria" text;