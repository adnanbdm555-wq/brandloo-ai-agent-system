CREATE TYPE "public"."automation_action" AS ENUM('GENERATE_CONTENT');--> statement-breakpoint
CREATE TYPE "public"."automation_trigger" AS ENUM('SCHEDULE');--> statement-breakpoint
CREATE TABLE "agencies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"invite_code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "agencies_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "automation_rules" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"brand_id" text NOT NULL,
	"name" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"trigger" "automation_trigger" DEFAULT 'SCHEDULE' NOT NULL,
	"schedule_day_of_week" integer,
	"schedule_hour_utc" integer DEFAULT 9 NOT NULL,
	"action" "automation_action" DEFAULT 'GENERATE_CONTENT' NOT NULL,
	"campaign_id" text,
	"template_id" text,
	"platform" text NOT NULL,
	"content_type" "content_type" DEFAULT 'POST' NOT NULL,
	"brief_override" text,
	"last_run_at" timestamp,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_templates" (
	"id" text PRIMARY KEY NOT NULL,
	"agency_id" text NOT NULL,
	"brand_id" text,
	"name" text NOT NULL,
	"category" text NOT NULL,
	"brief_template" text NOT NULL,
	"default_platform" text,
	"default_content_type" "content_type" DEFAULT 'POST' NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_insights" ADD COLUMN "agency_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "brand_knowledge" ADD COLUMN "agency_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "brands" ADD COLUMN "agency_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "campaigns" ADD COLUMN "agency_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "agency_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD COLUMN "agency_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "agency_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_template_id_content_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."content_templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "automation_rules" ADD CONSTRAINT "automation_rules_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_templates" ADD CONSTRAINT "content_templates_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_templates" ADD CONSTRAINT "content_templates_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_templates" ADD CONSTRAINT "content_templates_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "automation_rules_agency_idx" ON "automation_rules" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "automation_rules_brand_idx" ON "automation_rules" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "content_templates_agency_idx" ON "content_templates" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "content_templates_brand_idx" ON "content_templates" USING btree ("brand_id");--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_knowledge" ADD CONSTRAINT "brand_knowledge_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_agency_id_agencies_id_fk" FOREIGN KEY ("agency_id") REFERENCES "public"."agencies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brands_agency_idx" ON "brands" USING btree ("agency_id");--> statement-breakpoint
CREATE INDEX "users_agency_idx" ON "users" USING btree ("agency_id");