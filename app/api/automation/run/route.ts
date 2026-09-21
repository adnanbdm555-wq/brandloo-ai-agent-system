import { NextResponse } from "next/server";
import { db } from "@/db";
import { automationRules, contentTemplates, contentItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { runContentAgent } from "@/lib/ai/content-agent";
import { AgentConfigError } from "@/lib/ai/client";

/** Called on a timer by an external scheduler (Vercel Cron, or any cron
 * service) — not by users. There's no scheduler running inside this app
 * itself; see README for wiring this up with a vercel.json cron entry.
 * Protected by CRON_SECRET rather than a user session, since the caller
 * isn't a logged-in person. */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not set. Add it to enable scheduled automation." },
      { status: 503 }
    );
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const currentHour = now.getUTCHours();
  const currentDay = now.getUTCDay();

  const enabledRules = await db
    .select()
    .from(automationRules)
    .where(eq(automationRules.enabled, true));

  const due = enabledRules.filter((rule) => {
    if (rule.scheduleHourUtc !== currentHour) return false;
    if (rule.scheduleDayOfWeek !== null && rule.scheduleDayOfWeek !== currentDay) return false;
    if (rule.lastRunAt) {
      const last = new Date(rule.lastRunAt);
      const sameDay =
        last.getUTCFullYear() === now.getUTCFullYear() &&
        last.getUTCMonth() === now.getUTCMonth() &&
        last.getUTCDate() === now.getUTCDate();
      if (sameDay) return false;
    }
    return true;
  });

  const results: { ruleId: string; ruleName: string; ok: boolean; error?: string }[] = [];

  for (const rule of due) {
    try {
      let brief = rule.briefOverride ?? "";
      if (rule.templateId) {
        const [template] = await db
          .select()
          .from(contentTemplates)
          .where(eq(contentTemplates.id, rule.templateId))
          .limit(1);
        if (template) brief = template.briefTemplate;
      }
      if (!brief) throw new Error("No brief or template configured");

      const result = await runContentAgent({
        brandId: rule.brandId,
        campaignId: rule.campaignId,
        platform: rule.platform,
        contentType: rule.contentType,
        brief,
      });

      await db.insert(contentItems).values({
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
      });

      await db
        .update(automationRules)
        .set({ lastRunAt: now })
        .where(eq(automationRules.id, rule.id));

      results.push({ ruleId: rule.id, ruleName: rule.name, ok: true });
    } catch (err) {
      const message =
        err instanceof AgentConfigError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Unknown error";
      results.push({ ruleId: rule.id, ruleName: rule.name, ok: false, error: message });
    }
  }

  return NextResponse.json({ checked: enabledRules.length, ran: due.length, results });
}
