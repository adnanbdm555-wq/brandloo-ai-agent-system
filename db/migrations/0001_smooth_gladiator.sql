CREATE TYPE "public"."campaign_status" AS ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('DRAFT', 'READY');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('POST', 'REEL', 'STORY', 'CAROUSEL', 'VIDEO', 'ARTICLE');--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"name" text NOT NULL,
	"objective" text,
	"status" "campaign_status" DEFAULT 'DRAFT' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"target_platforms" text,
	"content_pillars" text,
	"key_messages" text,
	"strategy_notes" text,
	"strategy_generated_at" timestamp,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"campaign_id" text,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"hashtags" text,
	"platform" text,
	"content_type" "content_type" DEFAULT 'POST' NOT NULL,
	"status" "content_status" DEFAULT 'DRAFT' NOT NULL,
	"scheduled_date" timestamp,
	"source_brief" text,
	"generated_by_agent" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaigns_brand_idx" ON "campaigns" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "campaigns_created_by_idx" ON "campaigns" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "content_items_brand_idx" ON "content_items" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "content_items_campaign_idx" ON "content_items" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "content_items_scheduled_idx" ON "content_items" USING btree ("scheduled_date");