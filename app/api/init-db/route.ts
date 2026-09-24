import { NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

const SQL_STATEMENTS = [
  // Enums
  `DO $$ BEGIN CREATE TYPE "public"."knowledge_category" AS ENUM('COMPANY_INFORMATION', 'PRODUCTS', 'SERVICES', 'FAQS', 'USPS', 'TARGET_AUDIENCE', 'CUSTOMER_PAIN_POINTS', 'CUSTOMER_BENEFITS', 'COMPETITORS', 'BRAND_VOICE', 'CAMPAIGN_HISTORY', 'PREVIOUS_CONTENT', 'APPROVED_CLAIMS', 'RESTRICTED_CLAIMS', 'VISUAL_GUIDELINES', 'MARKETING_OBJECTIVES'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'MARKETING_MANAGER', 'CONTENT_MANAGER', 'DESIGNER', 'CLIENT', 'VIEWER'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."campaign_status" AS ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."content_status" AS ENUM('DRAFT', 'READY', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'PUBLISHED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."content_type" AS ENUM('POST', 'REEL', 'STORY', 'CAROUSEL', 'VIDEO', 'ARTICLE'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."approval_action" AS ENUM('SUBMITTED', 'APPROVED', 'REJECTED', 'COMMENTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."qa_status" AS ENUM('NOT_RUN', 'PASS', 'WARNINGS', 'FAIL'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."notification_type" AS ENUM('CONTENT_SUBMITTED', 'CONTENT_APPROVED', 'CONTENT_REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."platform" AS ENUM('INSTAGRAM', 'FACEBOOK', 'LINKEDIN', 'YOUTUBE', 'TIKTOK', 'X'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."automation_action" AS ENUM('GENERATE_CONTENT'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."automation_trigger" AS ENUM('SCHEDULE'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."invoice_status" AS ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."subscription_status" AS ENUM('TRIALING', 'ACTIVE', 'PAST_DUE', 'SUSPENDED', 'CANCELED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  `DO $$ BEGIN CREATE TYPE "public"."pipeline_status" AS ENUM('RUNNING', 'COMPLETED', 'FAILED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,

  // Agencies
  `CREATE TABLE IF NOT EXISTS "agencies" (
    "id" text PRIMARY KEY NOT NULL,
    "name" text NOT NULL,
    "invite_code" text NOT NULL UNIQUE,
    "created_at" timestamp DEFAULT now() NOT NULL
  );`,

  // Users
  `CREATE TABLE IF NOT EXISTS "users" (
    "id" text PRIMARY KEY NOT NULL,
    "agency_id" text REFERENCES "agencies"("id") ON DELETE cascade,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "password_hash" text NOT NULL,
    "role" "role" DEFAULT 'VIEWER' NOT NULL,
    "is_platform_admin" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  );`,

  // Subscriptions
  `CREATE TABLE IF NOT EXISTS "subscriptions" (
    "id" text PRIMARY KEY NOT NULL,
    "agency_id" text NOT NULL UNIQUE REFERENCES "agencies"("id") ON DELETE cascade,
    "status" "subscription_status" DEFAULT 'TRIALING' NOT NULL,
    "plan_name" text DEFAULT 'Standard' NOT NULL,
    "price_amount" integer NOT NULL,
    "billing_period_days" integer DEFAULT 30 NOT NULL,
    "trial_ends_at" timestamp NOT NULL,
    "trial_reminder_sent_at" timestamp,
    "current_period_end" timestamp,
    "grace_period_ends_at" timestamp,
    "last_payment_at" timestamp,
    "last_changed_by_id" text REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  );`,

  // Invoices
  `CREATE TABLE IF NOT EXISTS "invoices" (
    "id" text PRIMARY KEY NOT NULL,
    "agency_id" text NOT NULL REFERENCES "agencies"("id") ON DELETE cascade,
    "subscription_id" text NOT NULL REFERENCES "subscriptions"("id") ON DELETE cascade,
    "invoice_number" text NOT NULL UNIQUE,
    "amount" integer NOT NULL,
    "currency" text DEFAULT 'PKR' NOT NULL,
    "status" "invoice_status" DEFAULT 'PENDING' NOT NULL,
    "due_date" timestamp NOT NULL,
    "paid_at" timestamp,
    "safepay_checkout_token" text,
    "safepay_payment_ref" text,
    "created_at" timestamp DEFAULT now() NOT NULL
  );`,

  // Brands
  `CREATE TABLE IF NOT EXISTS "brands" (
    "id" text PRIMARY KEY NOT NULL,
    "agency_id" text NOT NULL REFERENCES "agencies"("id") ON DELETE cascade,
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
    "created_by_id" text NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  );`,

  // Brand Knowledge
  `CREATE TABLE IF NOT EXISTS "brand_knowledge" (
    "id" text PRIMARY KEY NOT NULL,
    "agency_id" text NOT NULL REFERENCES "agencies"("id") ON DELETE cascade,
    "brand_id" text NOT NULL REFERENCES "brands"("id") ON DELETE cascade,
    "category" "knowledge_category" NOT NULL,
    "title" text NOT NULL,
    "content" text NOT NULL,
    "source_file_name" text,
    "source_file_type" text,
    "created_by_id" text NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  );`,

  // Campaigns
  `CREATE TABLE IF NOT EXISTS "campaigns" (
    "id" text PRIMARY KEY NOT NULL,
    "agency_id" text NOT NULL REFERENCES "agencies"("id") ON DELETE cascade,
    "brand_id" text NOT NULL REFERENCES "brands"("id") ON DELETE cascade,
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
    "created_by_id" text NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  );`,

  // Social Accounts
  `CREATE TABLE IF NOT EXISTS "social_accounts" (
    "id" text PRIMARY KEY NOT NULL,
    "agency_id" text NOT NULL REFERENCES "agencies"("id") ON DELETE cascade,
    "brand_id" text NOT NULL REFERENCES "brands"("id") ON DELETE cascade,
    "platform" "platform" NOT NULL,
    "account_name" text NOT NULL,
    "profile_url" text,
    "created_by_id" text NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL
  );`,

  // Content Items
  `CREATE TABLE IF NOT EXISTS "content_items" (
    "id" text PRIMARY KEY NOT NULL,
    "agency_id" text NOT NULL REFERENCES "agencies"("id") ON DELETE cascade,
    "brand_id" text NOT NULL REFERENCES "brands"("id") ON DELETE cascade,
    "campaign_id" text REFERENCES "campaigns"("id") ON DELETE set null,
    "title" text NOT NULL,
    "body" text NOT NULL,
    "hashtags" text,
    "platform" text,
    "content_type" "content_type" DEFAULT 'POST' NOT NULL,
    "status" "content_status" DEFAULT 'DRAFT' NOT NULL,
    "scheduled_date" timestamp,
    "source_brief" text,
    "generated_by_agent" text,
    "qa_status" "qa_status" DEFAULT 'NOT_RUN' NOT NULL,
    "qa_summary" text,
    "qa_issues" text,
    "qa_ran_at" timestamp,
    "published_at" timestamp,
    "published_url" text,
    "social_account_id" text REFERENCES "social_accounts"("id") ON DELETE set null,
    "reach" integer,
    "impressions" integer,
    "likes" integer,
    "comments" integer,
    "shares" integer,
    "link_clicks" integer,
    "metrics_updated_at" timestamp,
    "created_by_id" text NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
  );`,

  // Content Approval Events
  `CREATE TABLE IF NOT EXISTS "content_approval_events" (
    "id" text PRIMARY KEY NOT NULL,
    "content_item_id" text NOT NULL REFERENCES "content_items"("id") ON DELETE cascade,
    "action" "approval_action" NOT NULL,
    "notes" text,
    "actor_id" text NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL
  );`,

  // Creative Assets
  `CREATE TABLE IF NOT EXISTS "creative_assets" (
    "id" text PRIMARY KEY NOT NULL,
    "content_item_id" text NOT NULL REFERENCES "content_items"("id") ON DELETE cascade,
    "brief_text" text NOT NULL,
    "visual_direction" text,
    "suggested_aspect_ratio" text,
    "image_url" text,
    "created_by_id" text NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL
  );`,

  // Video Scripts
  `CREATE TABLE IF NOT EXISTS "video_scripts" (
    "id" text PRIMARY KEY NOT NULL,
    "content_item_id" text NOT NULL REFERENCES "content_items"("id") ON DELETE cascade,
    "title" text NOT NULL,
    "scenes" text NOT NULL,
    "total_duration_seconds" text,
    "created_by_id" text NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL
  );`,

  // Notifications
  `CREATE TABLE IF NOT EXISTS "notifications" (
    "id" text PRIMARY KEY NOT NULL,
    "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
    "type" "notification_type" NOT NULL,
    "title" text NOT NULL,
    "body" text,
    "link" text,
    "read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
  );`,

  // AI Insights
  `CREATE TABLE IF NOT EXISTS "ai_insights" (
    "id" text PRIMARY KEY NOT NULL,
    "agency_id" text NOT NULL REFERENCES "agencies"("id") ON DELETE cascade,
    "brand_id" text NOT NULL REFERENCES "brands"("id") ON DELETE cascade,
    "summary" text NOT NULL,
    "observations" text NOT NULL,
    "recommendations" text NOT NULL,
    "data_points_used" integer NOT NULL,
    "created_by_id" text NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL
  );`,

  // Content Templates
  `CREATE TABLE IF NOT EXISTS "content_templates" (
    "id" text PRIMARY KEY NOT NULL,
    "agency_id" text NOT NULL REFERENCES "agencies"("id") ON DELETE cascade,
    "brand_id" text REFERENCES "brands"("id") ON DELETE cascade,
    "name" text NOT NULL,
    "category" text NOT NULL,
    "brief_template" text NOT NULL,
    "default_platform" text,
    "default_content_type" "content_type" DEFAULT 'POST' NOT NULL,
    "created_by_id" text NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL
  );`,

  // Automation Rules
  `CREATE TABLE IF NOT EXISTS "automation_rules" (
    "id" text PRIMARY KEY NOT NULL,
    "agency_id" text NOT NULL REFERENCES "agencies"("id") ON DELETE cascade,
    "brand_id" text NOT NULL REFERENCES "brands"("id") ON DELETE cascade,
    "name" text NOT NULL,
    "enabled" boolean DEFAULT true NOT NULL,
    "trigger" "automation_trigger" DEFAULT 'SCHEDULE' NOT NULL,
    "schedule_day_of_week" integer,
    "schedule_hour_utc" integer DEFAULT 9 NOT NULL,
    "action" "automation_action" DEFAULT 'GENERATE_CONTENT' NOT NULL,
    "campaign_id" text REFERENCES "campaigns"("id") ON DELETE set null,
    "template_id" text REFERENCES "content_templates"("id") ON DELETE set null,
    "platform" text NOT NULL,
    "content_type" "content_type" DEFAULT 'POST' NOT NULL,
    "brief_override" text,
    "last_run_at" timestamp,
    "created_by_id" text NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL
  );`,

  // Pipeline Runs
  `CREATE TABLE IF NOT EXISTS "pipeline_runs" (
    "id" text PRIMARY KEY NOT NULL,
    "agency_id" text NOT NULL REFERENCES "agencies"("id") ON DELETE cascade,
    "brand_id" text NOT NULL REFERENCES "brands"("id") ON DELETE cascade,
    "campaign_id" text REFERENCES "campaigns"("id") ON DELETE set null,
    "content_item_id" text REFERENCES "content_items"("id") ON DELETE set null,
    "status" "pipeline_status" DEFAULT 'RUNNING' NOT NULL,
    "steps" text NOT NULL,
    "created_by_id" text NOT NULL REFERENCES "users"("id"),
    "created_at" timestamp DEFAULT now() NOT NULL,
    "completed_at" timestamp
  );`,

  // Indexes
  `CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users" ("email");`,
  `CREATE INDEX IF NOT EXISTS "users_agency_idx" ON "users" ("agency_id");`,
  `CREATE INDEX IF NOT EXISTS "brands_agency_idx" ON "brands" ("agency_id");`,
  `CREATE INDEX IF NOT EXISTS "brand_knowledge_brand_idx" ON "brand_knowledge" ("brand_id");`,
  `CREATE INDEX IF NOT EXISTS "campaigns_brand_idx" ON "campaigns" ("brand_id");`,
  `CREATE INDEX IF NOT EXISTS "content_items_brand_idx" ON "content_items" ("brand_id");`,
  `CREATE INDEX IF NOT EXISTS "notifications_user_idx" ON "notifications" ("user_id");`,
  `CREATE INDEX IF NOT EXISTS "subscriptions_agency_idx" ON "subscriptions" ("agency_id");`,
  `CREATE INDEX IF NOT EXISTS "pipeline_runs_agency_idx" ON "pipeline_runs" ("agency_id");`
];

export async function GET() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return NextResponse.json(
      { error: "DATABASE_URL environment variable is missing in Vercel settings." },
      { status: 500 }
    );
  }

  try {
    for (const statement of SQL_STATEMENTS) {
      await db.execute(sql.raw(statement));
    }

    return NextResponse.json({
      success: true,
      message: "Database tables and enums initialized successfully! You can now register and sign in."
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Failed to initialize database",
        details: error?.message ?? String(error)
      },
      { status: 500 }
    );
  }
}
