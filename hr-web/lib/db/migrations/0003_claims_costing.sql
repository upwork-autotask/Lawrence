CREATE TABLE "activities" (
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
CREATE TABLE "cost_of_sale" (
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
CREATE TABLE "overheads" (
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
ALTER TABLE "expenses" ADD COLUMN "depot_id" uuid;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "cost_of_sale_id" uuid;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "activities_id" uuid;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "overheads_id" uuid;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "period_start" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "period_end" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "cost_ex_vat" double precision;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "vat_rate" double precision;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "vat_amount" double precision;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "approved_by" text;--> statement-breakpoint
ALTER TABLE "expenses" ADD COLUMN "signed_on" timestamp with time zone;--> statement-breakpoint
CREATE UNIQUE INDEX "activities_name_unique" ON "activities" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "cost_of_sale_name_unique" ON "cost_of_sale" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "overheads_name_unique" ON "overheads" USING btree ("name");--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_depot_id_depots_id_fk" FOREIGN KEY ("depot_id") REFERENCES "public"."depots"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_cost_of_sale_id_cost_of_sale_id_fk" FOREIGN KEY ("cost_of_sale_id") REFERENCES "public"."cost_of_sale"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_activities_id_activities_id_fk" FOREIGN KEY ("activities_id") REFERENCES "public"."activities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_overheads_id_overheads_id_fk" FOREIGN KEY ("overheads_id") REFERENCES "public"."overheads"("id") ON DELETE no action ON UPDATE no action;