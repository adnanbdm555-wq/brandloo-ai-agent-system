CREATE TABLE "ai_insights" (
	"id" text PRIMARY KEY NOT NULL,
	"brand_id" text NOT NULL,
	"summary" text NOT NULL,
	"observations" text NOT NULL,
	"recommendations" text NOT NULL,
	"data_points_used" integer NOT NULL,
	"created_by_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "reach" integer;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "impressions" integer;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "likes" integer;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "comments" integer;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "shares" integer;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "link_clicks" integer;--> statement-breakpoint
ALTER TABLE "content_items" ADD COLUMN "metrics_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ai_insights_brand_idx" ON "ai_insights" USING btree ("brand_id");