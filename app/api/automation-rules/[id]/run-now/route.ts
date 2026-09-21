import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { automationRules, contentTemplates, contentItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { canEdit } from "@/lib/roles";
import { runContentAgent } from "@/lib/ai/content-agent";
import { AgentConfigError } from "@/lib/ai/client";

// Same logic as api/automation/run's per-rule execution, but triggered by
// a person clicking a button (ignores the schedule — runs immediately)
// rather than by the cron endpoint on a timer.
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEdit(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to run automations" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const [rule] = await db
    .select()
    .from(automationRules)
    .where(and(eq(automationRules.id, id), eq(automationRules.agencyId, session.user.agencyId)))
    .limit(1);
  if (!rule) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let brief = rule.briefOverride ?? "";
  if (rule.templateId) {
    const [template] = await db
      .select()
      .from(contentTemplates)
      .where(eq(contentTemplates.id, rule.templateId))
      .limit(1);
    if (template) brief = template.briefTemplate;
  }
  if (!brief) {
    return NextResponse.json({ error: "This automation has no brief or template set" }, { status: 400 });
  }

  try {
    const result = await runContentAgent({
      brandId: rule.brandId,
      campaignId: rule.campaignId,
      platform: rule.platform,
      contentType: rule.contentType,
      brief,
    });

    const [created] = await db
      .insert(contentItems)
      .values({
        agencyId: rule.agencyId,
        brandId: rule.brandId,
        campaignId: rule.campaignId,
        title: result.title,
        body: result.body,
        hashtags: JSON.stringify(result.hashtags),
        platform: rule.platform,
        contentType: rule.contentType,
        status: "DRAFT",
        sourceBrief: brief,
        generatedByAgent: "automation-rule",
        createdById: rule.createdById,
      })
      .returning();

    await db
      .update(automationRules)
      .set({ lastRunAt: new Date() })
      .where(eq(automationRules.id, id));

    return NextResponse.json({ content: created }, { status: 201 });
  } catch (err) {
    if (err instanceof AgentConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("Automation run error:", err);
    return NextResponse.json(
      { error: "This automation couldn't complete. Try again." },
      { status: 502 }
    );
  }
}
