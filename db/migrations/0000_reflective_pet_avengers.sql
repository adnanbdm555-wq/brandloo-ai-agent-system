CREATE TYPE "public"."knowledge_category" AS ENUM('COMPANY_INFORMATION', 'PRODUCTS', 'SERVICES', 'FAQS', 'USPS', 'TARGET_AUDIENCE', 'CUSTOMER_PAIN_POINTS', 'CUSTOMER_BENEFITS', 'COMPETITORS', 'BRAND_VOICE', 'CAMPAIGN_HISTORY', 'PREVIOUS_CONTENT', 'APPROVED_CLAIMS', 'RESTRICTED_CLAIMS', 'VISUAL_GUIDELINES', 'MARKETING_OBJECTIVES');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'MARKETING_MANAGER', 'CONTENT_MANAGER', 'DESIGNER', 'CLIENT', 'VIEWER');--> statement-breakpoint
CREATE TABLE "brand_knowledge" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"category" "knowledge_category" NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"source_file_name" text,
	"source_file_type" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "brands" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"industry" text,
	"website" text,
	"description" text,
	"target_audience" text,
	"products" text,
	"services" text,
	"usp" text,
	"brand_colors" text,
	"typography" text,
	"logo_url" text,
	"tone_of_voice" text,
	"communication_style" text,
	"primary_language" text DEFAULT 'English',
	"secondary_language" text,
	"social_platforms" text,
	"competitors" text,
	"approved_ctas" text,
	"forbidden_words" text,
	"required_hashtags" text,
	"location" text,
	"contact_information" text,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'VIEWER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "brand_knowledge" ADD CONSTRAINT "brand_knowledge_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brand_knowledge" ADD CONSTRAINT "brand_knowledge_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "brands" ADD CONSTRAINT "brands_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "brand_knowledge_brand_idx" ON "brand_knowledge" USING btree ("brand_id");--> statement-breakpoint
CREATE INDEX "brand_knowledge_brand_category_idx" ON "brand_knowledge" USING btree ("brand_id","category");--> statement-breakpoint
CREATE INDEX "brands_created_by_idx" ON "brands" USING btree ("created_by_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");