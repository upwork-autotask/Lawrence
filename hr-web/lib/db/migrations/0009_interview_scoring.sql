CREATE TABLE "interview_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"heading" text,
	"question" text NOT NULL,
	"model_answer" text,
	"max_score" double precision DEFAULT 5 NOT NULL,
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
CREATE TABLE "interview_scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"question_id" uuid,
	"question" text,
	"score" double precision,
	"answer" text,
	"notes" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"legacy_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid
);
--> statement-breakpoint
ALTER TABLE "interview_scores" ADD CONSTRAINT "interview_scores_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_scores" ADD CONSTRAINT "interview_scores_question_id_interview_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."interview_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "interview_questions_heading_idx" ON "interview_questions" USING btree ("heading");--> statement-breakpoint
CREATE INDEX "interview_scores_interview_idx" ON "interview_scores" USING btree ("interview_id");