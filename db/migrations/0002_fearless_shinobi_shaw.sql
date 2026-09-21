CREATE TYPE "public"."approval_action" AS ENUM('SUBMITTED', 'APPROVED', 'REJECTED', 'COMMENTED');--> statement-breakpoint
CREATE TYPE "public"."qa_status" AS ENUM('NOT_RUN', 'PASS', 'WARNINGS', 'FAIL');--> statement-breakpoint
ALTER TYPE "public"."content_status" ADD VALUE 'PENDING_APPROVAL';--> statement-breakpoint
ALTER TYPE "public"."content_status" ADD VALUE 'APPROVED';--> statement-breakpoint
ALTER TYPE "public"."content_status" ADD VALUE 'REJECTED';--> statement-breakpoint
CREATE TABLE "content_approval_events" (
	"id" text PRIMARY KEY NOT NULL,
	"content_item_id" text NOT NULL,
	"action" "approval_action" NOT NULL,
	"notes" text,
	"actor_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creative_assets" (
	"id" text PRIMARY KEY NOT NULL,
	"content_item_id" text NOT NULL,
	"brief_text" text NOT NULL,
	"visual_direction" text,
	"suggested_aspect_ratio" text,
	"image_url" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "video_scripts" (
	"id" text PRIMARY KEY NOT NULL,
	"content_item_id" text NOT NULL,
	"title" text NOT NULL,
	"scenes" text NOT NULL,
	"total_duration_seconds" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "qa_status" "qa_status" DEFAULT 'NOT_RUN' NOT NULL;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "qa_summary" text;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "qa_issues" text;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "qa_ran_at" timestamp;--> statement-breakpoint
ALTER TABLE "content_approval_events" ADD CONSTRAINT "content_approval_events_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_approval_events" ADD CONSTRAINT "content_approval_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_assets" ADD CONSTRAINT "creative_assets_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "creative_assets" ADD CONSTRAINT "creative_assets_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_scripts" ADD CONSTRAINT "video_scripts_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "video_scripts" ADD CONSTRAINT "video_scripts_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approval_events_content_idx" ON "content_approval_events" USING btree ("content_item_id");--> statement-breakpoint
CREATE INDEX "creative_assets_content_idx" ON "creative_assets" USING btree ("content_item_id");--> statement-breakpoint
CREATE INDEX "video_scripts_content_idx" ON "video_scripts" USING btree ("content_item_id");