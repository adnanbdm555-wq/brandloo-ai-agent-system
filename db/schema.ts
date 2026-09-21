// Phase 1 schema: Authentication, Brand Management, Brand Knowledge Base.
// Later phases (Campaigns, Content, Approvals, Publishing, Analytics, Agents,
// Automation) add their own tables here without touching what's below —
// see README.md "Roadmap" for the full table list from the master prompt.

import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  index,
  boolean,
  integer,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createId } from "./id";

export const roleEnum = pgEnum("role", [
  "SUPER_ADMIN",
  "ADMIN",
  "MARKETING_MANAGER",
  "CONTENT_MANAGER",
  "DESIGNER",
  "CLIENT",
  "VIEWER",
]);

export const knowledgeCategoryEnum = pgEnum("knowledge_category", [
  "COMPANY_INFORMATION",
  "PRODUCTS",
  "SERVICES",
  "FAQS",
  "USPS",
  "TARGET_AUDIENCE",
  "CUSTOMER_PAIN_POINTS",
  "CUSTOMER_BENEFITS",
  "COMPETITORS",
  "BRAND_VOICE",
  "CAMPAIGN_HISTORY",
  "PREVIOUS_CONTENT",
  "APPROVED_CLAIMS",
  "RESTRICTED_CLAIMS",
  "VISUAL_GUIDELINES",
  "MARKETING_OBJECTIVES",
]);

// A workspace/tenant. Every user belongs to exactly one; every brand (and
// everything under it — campaigns, content, knowledge, etc.) belongs to
// exactly one, matching its creator's agency. This is the isolation
// boundary: nothing here is ever queried without filtering by agencyId.
export const agencies = pgTable("agencies", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const agenciesRelations = relations(agencies, ({ many }) => ({
  users: many(users),
  brands: many(brands),
}));

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("VIEWER"),
    // Platform-level, not agency-scoped — the very first person to ever
    // register on this whole install (before any agency existed) gets
    // this automatically. See api/register/route.ts.
    isPlatformAdmin: boolean("is_platform_admin").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("users_email_idx").on(table.email),
    index("users_agency_idx").on(table.agencyId),
  ]
);

export const brands = pgTable(
  "brands",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    industry: text("industry"),
    website: text("website"),
    description: text("description"),

    targetAudience: text("target_audience"),
    products: text("products"),
    services: text("services"),
    usp: text("usp"),

    // JSON-encoded string arrays (kept as plain text columns so the schema
    // stays simple across Postgres providers — parse with JSON.parse/stringify).
    brandColors: text("brand_colors"),
    typography: text("typography"),
    logoUrl: text("logo_url"),

    toneOfVoice: text("tone_of_voice"),
    communicationStyle: text("communication_style"),
    primaryLanguage: text("primary_language").default("English"),
    secondaryLanguage: text("secondary_language"),

    socialPlatforms: text("social_platforms"),
    competitors: text("competitors"),
    approvedCtas: text("approved_ctas"),
    forbiddenWords: text("forbidden_words"),
    requiredHashtags: text("required_hashtags"),

    location: text("location"),
    contactInformation: text("contact_information"),

    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("brands_created_by_idx").on(table.createdById),
    index("brands_agency_idx").on(table.agencyId),
  ]
);

export const brandKnowledge = pgTable(
  "brand_knowledge",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    category: knowledgeCategoryEnum("category").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),

    sourceFileName: text("source_file_name"),
    sourceFileType: text("source_file_type"),

    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("brand_knowledge_brand_idx").on(table.brandId),
    index("brand_knowledge_brand_category_idx").on(
      table.brandId,
      table.category
    ),
  ]
);

export const usersRelations = relations(users, ({ many }) => ({
  brands: many(brands),
  knowledgeAdded: many(brandKnowledge),
}));

export const brandsRelations = relations(brands, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [brands.createdById],
    references: [users.id],
  }),
  knowledge: many(brandKnowledge),
}));

export const brandKnowledgeRelations = relations(brandKnowledge, ({ one }) => ({
  brand: one(brands, {
    fields: [brandKnowledge.brandId],
    references: [brands.id],
  }),
  createdBy: one(users, {
    fields: [brandKnowledge.createdById],
    references: [users.id],
  }),
}));

// ---------------------------------------------------------------------------
// Phase 2: Strategy Agent, Content Agent, Content Calendar, Content Studio
// ---------------------------------------------------------------------------

export const campaignStatusEnum = pgEnum("campaign_status", [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
]);

export const contentTypeEnum = pgEnum("content_type", [
  "POST",
  "REEL",
  "STORY",
  "CAROUSEL",
  "VIDEO",
  "ARTICLE",
]);

export const contentStatusEnum = pgEnum("content_status", [
  "DRAFT",
  "READY",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "PUBLISHED",
]);

export const qaStatusEnum = pgEnum("qa_status", [
  "NOT_RUN",
  "PASS",
  "WARNINGS",
  "FAIL",
]);

export const campaigns = pgTable(
  "campaigns",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    objective: text("objective"),
    status: campaignStatusEnum("status").notNull().default("DRAFT"),
    startDate: timestamp("start_date"),
    endDate: timestamp("end_date"),
    targetPlatforms: text("target_platforms"), // JSON array

    // Populated by the Strategy Agent (see lib/ai/strategy-agent.ts)
    contentPillars: text("content_pillars"), // JSON array
    keyMessages: text("key_messages"),
    strategyNotes: text("strategy_notes"),
    strategyGeneratedAt: timestamp("strategy_generated_at"),

    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("campaigns_brand_idx").on(table.brandId),
    index("campaigns_created_by_idx").on(table.createdById),
  ]
);

export const contentItems = pgTable(
  "content_items",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    campaignId: text("campaign_id").references(() => campaigns.id, {
      onDelete: "set null",
    }),

    title: text("title").notNull(),
    body: text("body").notNull(),
    hashtags: text("hashtags"), // JSON array
    platform: text("platform"),
    contentType: contentTypeEnum("content_type").notNull().default("POST"),
    status: contentStatusEnum("status").notNull().default("DRAFT"),
    scheduledDate: timestamp("scheduled_date"),

    // What the Content Agent was asked for, and whether it wrote this
    // (vs. a human typing it directly in Content Studio).
    sourceBrief: text("source_brief"),
    generatedByAgent: text("generated_by_agent"), // e.g. "content-agent-v1", null if human-written

    // Populated by the QA Agent (see lib/ai/qa-agent.ts)
    qaStatus: qaStatusEnum("qa_status").notNull().default("NOT_RUN"),
    qaSummary: text("qa_summary"),
    qaIssues: text("qa_issues"), // JSON array of strings
    qaRanAt: timestamp("qa_ran_at"),

    // Phase 4: set once a human (or, later, a real platform integration)
    // marks this as actually posted.
    publishedAt: timestamp("published_at"),
    publishedUrl: text("published_url"),
    socialAccountId: text("social_account_id").references(
      (): AnyPgColumn => socialAccounts.id,
      { onDelete: "set null" }
    ),

    // Phase 5: entered manually from what you actually see on the
    // platform's own analytics — never invented. Nullable because most
    // posts won't have numbers until someone checks and enters them.
    reach: integer("reach"),
    impressions: integer("impressions"),
    likes: integer("likes"),
    comments: integer("comments"),
    shares: integer("shares"),
    linkClicks: integer("link_clicks"),
    metricsUpdatedAt: timestamp("metrics_updated_at"),

    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("content_items_brand_idx").on(table.brandId),
    index("content_items_campaign_idx").on(table.campaignId),
    index("content_items_scheduled_idx").on(table.scheduledDate),
  ]
);

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  brand: one(brands, { fields: [campaigns.brandId], references: [brands.id] }),
  createdBy: one(users, {
    fields: [campaigns.createdById],
    references: [users.id],
  }),
  contentItems: many(contentItems),
}));

export const contentItemsRelations = relations(contentItems, ({ one }) => ({
  brand: one(brands, {
    fields: [contentItems.brandId],
    references: [brands.id],
  }),
  campaign: one(campaigns, {
    fields: [contentItems.campaignId],
    references: [campaigns.id],
  }),
  createdBy: one(users, {
    fields: [contentItems.createdById],
    references: [users.id],
  }),
}));

export type Campaign = typeof campaigns.$inferSelect;
export type NewCampaign = typeof campaigns.$inferInsert;
export type ContentItem = typeof contentItems.$inferSelect;
export type NewContentItem = typeof contentItems.$inferInsert;
export type Agency = typeof agencies.$inferSelect;
export type NewAgency = typeof agencies.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Brand = typeof brands.$inferSelect;
export type NewBrand = typeof brands.$inferInsert;
export type BrandKnowledgeEntry = typeof brandKnowledge.$inferSelect;
export type NewBrandKnowledgeEntry = typeof brandKnowledge.$inferInsert;

// ---------------------------------------------------------------------------
// Phase 3: Creative Agent, Video Agent, QA Agent, Approval System
// ---------------------------------------------------------------------------

export const approvalActionEnum = pgEnum("approval_action", [
  "SUBMITTED",
  "APPROVED",
  "REJECTED",
  "COMMENTED",
]);

export const contentApprovalEvents = pgTable(
  "content_approval_events",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    contentItemId: text("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    action: approvalActionEnum("action").notNull(),
    notes: text("notes"),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("approval_events_content_idx").on(table.contentItemId)]
);

export const creativeAssets = pgTable(
  "creative_assets",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    contentItemId: text("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),

    // Written by the Creative Agent (lib/ai/creative-agent.ts): a brief a
    // human designer (or an external image tool) executes against.
    briefText: text("brief_text").notNull(),
    visualDirection: text("visual_direction"), // colors, composition, mood
    suggestedAspectRatio: text("suggested_aspect_ratio"),

    // Filled in once a human attaches the actual asset — Phase 3 doesn't
    // generate image files itself (see README for why).
    imageUrl: text("image_url"),

    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("creative_assets_content_idx").on(table.contentItemId)]
);

export const videoScripts = pgTable(
  "video_scripts",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    contentItemId: text("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),

    title: text("title").notNull(),
    scenes: text("scenes").notNull(), // JSON array: [{scene, visual, voiceover, onScreenText, durationSeconds}]
    totalDurationSeconds: text("total_duration_seconds"),

    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("video_scripts_content_idx").on(table.contentItemId)]
);

export const contentApprovalEventsRelations = relations(
  contentApprovalEvents,
  ({ one }) => ({
    contentItem: one(contentItems, {
      fields: [contentApprovalEvents.contentItemId],
      references: [contentItems.id],
    }),
    actor: one(users, {
      fields: [contentApprovalEvents.actorId],
      references: [users.id],
    }),
  })
);

export const creativeAssetsRelations = relations(creativeAssets, ({ one }) => ({
  contentItem: one(contentItems, {
    fields: [creativeAssets.contentItemId],
    references: [contentItems.id],
  }),
  createdBy: one(users, {
    fields: [creativeAssets.createdById],
    references: [users.id],
  }),
}));

export const videoScriptsRelations = relations(videoScripts, ({ one }) => ({
  contentItem: one(contentItems, {
    fields: [videoScripts.contentItemId],
    references: [contentItems.id],
  }),
  createdBy: one(users, {
    fields: [videoScripts.createdById],
    references: [users.id],
  }),
}));

export type ContentApprovalEvent = typeof contentApprovalEvents.$inferSelect;
export type NewContentApprovalEvent = typeof contentApprovalEvents.$inferInsert;
export type CreativeAsset = typeof creativeAssets.$inferSelect;
export type NewCreativeAsset = typeof creativeAssets.$inferInsert;
export type VideoScript = typeof videoScripts.$inferSelect;
export type NewVideoScript = typeof videoScripts.$inferInsert;

// ---------------------------------------------------------------------------
// Phase 4: Publishing, Scheduling, Notifications
// ---------------------------------------------------------------------------

export const platformEnum = pgEnum("platform", [
  "INSTAGRAM",
  "FACEBOOK",
  "LINKEDIN",
  "YOUTUBE",
  "TIKTOK",
  "X",
]);

// A registry of the brand's actual social accounts. This is deliberately
// NOT an OAuth "Connect" flow — doing that for real requires app
// credentials registered with each platform (Meta, Google, LinkedIn) plus
// a stable public callback URL, which this project doesn't assume you
// have yet. See README for what real OAuth integration would add here.
export const socialAccounts = pgTable(
  "social_accounts",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    platform: platformEnum("platform").notNull(),
    accountName: text("account_name").notNull(), // e.g. "@kia_shehzore_smart"
    profileUrl: text("profile_url"),

    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("social_accounts_brand_idx").on(table.brandId)]
);

export const notificationTypeEnum = pgEnum("notification_type", [
  "CONTENT_SUBMITTED",
  "CONTENT_APPROVED",
  "CONTENT_REJECTED",
]);

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_user_read_idx").on(table.userId, table.read),
  ]
);

export const socialAccountsRelations = relations(socialAccounts, ({ one, many }) => ({
  brand: one(brands, {
    fields: [socialAccounts.brandId],
    references: [brands.id],
  }),
  createdBy: one(users, {
    fields: [socialAccounts.createdById],
    references: [users.id],
  }),
  contentItems: many(contentItems),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export type SocialAccount = typeof socialAccounts.$inferSelect;
export type NewSocialAccount = typeof socialAccounts.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// ---------------------------------------------------------------------------
// Phase 5: Analytics, AI Insights, Optimization Agent
// ---------------------------------------------------------------------------

// One agent that covers both "AI Insights" (what happened) and
// "Optimization" (what to do next) — they read the same data and produce
// one coherent output, so splitting them into two agents/tables would
// just mean passing the same context twice. See lib/ai/insights-agent.ts.
export const aiInsights = pgTable(
  "ai_insights",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),

    summary: text("summary").notNull(),
    observations: text("observations").notNull(), // JSON array of strings
    recommendations: text("recommendations").notNull(), // JSON array of strings
    dataPointsUsed: integer("data_points_used").notNull(),

    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("ai_insights_brand_idx").on(table.brandId)]
);

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  brand: one(brands, {
    fields: [aiInsights.brandId],
    references: [brands.id],
  }),
  createdBy: one(users, {
    fields: [aiInsights.createdById],
    references: [users.id],
  }),
}));

export type AIInsight = typeof aiInsights.$inferSelect;
export type NewAIInsight = typeof aiInsights.$inferInsert;

// ---------------------------------------------------------------------------
// Phase 6: Templates, Automation Builder, Agency features, Users & Roles
// ---------------------------------------------------------------------------

// Reusable starting points for the Content Agent — not finished posts,
// prompts. Global (brandId null) ones apply to any brand in the agency;
// brand-specific ones only show up for that brand.
export const contentTemplates = pgTable(
  "content_templates",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    brandId: text("brand_id").references(() => brands.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    category: text("category").notNull(), // free text, e.g. "Product highlight", "FAQ"
    briefTemplate: text("brief_template").notNull(),
    defaultPlatform: text("default_platform"),
    defaultContentType: contentTypeEnum("default_content_type").notNull().default("POST"),

    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("content_templates_agency_idx").on(table.agencyId),
    index("content_templates_brand_idx").on(table.brandId),
  ]
);

export const automationTriggerEnum = pgEnum("automation_trigger", ["SCHEDULE"]);
export const automationActionEnum = pgEnum("automation_action", ["GENERATE_CONTENT"]);

// A rule the /api/automation/run cron endpoint checks on each invocation.
// There's no background scheduler running inside this app itself — see
// README for wiring this to Vercel Cron (or any external scheduler) that
// calls that endpoint on a timer.
export const automationRules = pgTable(
  "automation_rules",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    enabled: boolean("enabled").notNull().default(true),

    trigger: automationTriggerEnum("trigger").notNull().default("SCHEDULE"),
    scheduleDayOfWeek: integer("schedule_day_of_week"), // 0=Sun .. 6=Sat, null = every day
    scheduleHourUtc: integer("schedule_hour_utc").notNull().default(9),

    action: automationActionEnum("action").notNull().default("GENERATE_CONTENT"),
    campaignId: text("campaign_id").references(() => campaigns.id, { onDelete: "set null" }),
    templateId: text("template_id").references(() => contentTemplates.id, {
      onDelete: "set null",
    }),
    platform: text("platform").notNull(),
    contentType: contentTypeEnum("content_type").notNull().default("POST"),
    briefOverride: text("brief_override"), // used if there's no templateId

    lastRunAt: timestamp("last_run_at"),

    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("automation_rules_agency_idx").on(table.agencyId),
    index("automation_rules_brand_idx").on(table.brandId),
  ]
);

export const contentTemplatesRelations = relations(contentTemplates, ({ one }) => ({
  brand: one(brands, {
    fields: [contentTemplates.brandId],
    references: [brands.id],
  }),
  createdBy: one(users, {
    fields: [contentTemplates.createdById],
    references: [users.id],
  }),
}));

export const automationRulesRelations = relations(automationRules, ({ one }) => ({
  brand: one(brands, {
    fields: [automationRules.brandId],
    references: [brands.id],
  }),
  campaign: one(campaigns, {
    fields: [automationRules.campaignId],
    references: [campaigns.id],
  }),
  template: one(contentTemplates, {
    fields: [automationRules.templateId],
    references: [contentTemplates.id],
  }),
  createdBy: one(users, {
    fields: [automationRules.createdById],
    references: [users.id],
  }),
}));

export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type NewContentTemplate = typeof contentTemplates.$inferInsert;
export type AutomationRule = typeof automationRules.$inferSelect;
export type NewAutomationRule = typeof automationRules.$inferInsert;

// ---------------------------------------------------------------------------
// Billing: 15-day trial, automatic invoicing, manual + automatic activation
// ---------------------------------------------------------------------------

export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "TRIALING",
  "ACTIVE",
  "PAST_DUE", // trial or period ended, invoice sent, not yet paid
  "SUSPENDED", // grace period passed unpaid — access blocked
  "CANCELED",
]);

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    agencyId: text("agency_id")
      .notNull()
      .unique()
      .references(() => agencies.id, { onDelete: "cascade" }),

    status: subscriptionStatusEnum("status").notNull().default("TRIALING"),
    planName: text("plan_name").notNull().default("Standard"),
    priceAmount: integer("price_amount").notNull(), // whole PKR per billing period
    billingPeriodDays: integer("billing_period_days").notNull().default(30),

    trialEndsAt: timestamp("trial_ends_at").notNull(),
    trialReminderSentAt: timestamp("trial_reminder_sent_at"),
    currentPeriodEnd: timestamp("current_period_end"),
    gracePeriodEndsAt: timestamp("grace_period_ends_at"), // set when PAST_DUE begins

    lastPaymentAt: timestamp("last_payment_at"),

    // Manual override trail — who last changed status by hand, vs. the
    // billing cron doing it automatically (actorId null = automatic).
    lastChangedById: text("last_changed_by_id").references(() => users.id),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("subscriptions_agency_idx").on(table.agencyId)]
);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "PENDING",
  "PAID",
  "OVERDUE",
  "CANCELED",
]);

export const invoices = pgTable(
  "invoices",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    subscriptionId: text("subscription_id")
      .notNull()
      .references(() => subscriptions.id, { onDelete: "cascade" }),

    invoiceNumber: text("invoice_number").notNull().unique(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("PKR"),
    status: invoiceStatusEnum("status").notNull().default("PENDING"),

    dueDate: timestamp("due_date").notNull(),
    paidAt: timestamp("paid_at"),

    // Safepay linkage — set once a checkout session exists / a payment
    // is confirmed via webhook. See lib/billing/safepay.ts.
    safepayCheckoutToken: text("safepay_checkout_token"),
    safepayPaymentRef: text("safepay_payment_ref"),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("invoices_agency_idx").on(table.agencyId),
    index("invoices_subscription_idx").on(table.subscriptionId),
  ]
);

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  agency: one(agencies, {
    fields: [subscriptions.agencyId],
    references: [agencies.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  agency: one(agencies, {
    fields: [invoices.agencyId],
    references: [agencies.id],
  }),
  subscription: one(subscriptions, {
    fields: [invoices.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

// ---------------------------------------------------------------------------
// One-click Pipeline: Strategy → Content → Creative → Video → QA → Submit,
// chained. Reuses the same five agent functions each Studio calls
// individually — this just orchestrates them in sequence and records what
// happened at each step.
// ---------------------------------------------------------------------------

export const pipelineStatusEnum = pgEnum("pipeline_status", [
  "RUNNING",
  "COMPLETED",
  "FAILED",
]);

export const pipelineRuns = pgTable(
  "pipeline_runs",
  {
    id: text("id").primaryKey().$defaultFn(() => createId()),
    agencyId: text("agency_id")
      .notNull()
      .references(() => agencies.id, { onDelete: "cascade" }),
    brandId: text("brand_id")
      .notNull()
      .references(() => brands.id, { onDelete: "cascade" }),
    campaignId: text("campaign_id").references(() => campaigns.id, {
      onDelete: "set null",
    }),
    contentItemId: text("content_item_id").references(() => contentItems.id, {
      onDelete: "set null",
    }),

    status: pipelineStatusEnum("status").notNull().default("RUNNING"),
    // JSON array of { step, status: "success"|"failed"|"skipped", detail?, error? }
    steps: text("steps").notNull(),

    createdById: text("created_by_id")
      .notNull()
      .references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("pipeline_runs_agency_idx").on(table.agencyId),
    index("pipeline_runs_brand_idx").on(table.brandId),
  ]
);

export const pipelineRunsRelations = relations(pipelineRuns, ({ one }) => ({
  brand: one(brands, { fields: [pipelineRuns.brandId], references: [brands.id] }),
  campaign: one(campaigns, {
    fields: [pipelineRuns.campaignId],
    references: [campaigns.id],
  }),
  contentItem: one(contentItems, {
    fields: [pipelineRuns.contentItemId],
    references: [contentItems.id],
  }),
  createdBy: one(users, {
    fields: [pipelineRuns.createdById],
    references: [users.id],
  }),
}));

export type PipelineRun = typeof pipelineRuns.$inferSelect;
export type NewPipelineRun = typeof pipelineRuns.$inferInsert;
