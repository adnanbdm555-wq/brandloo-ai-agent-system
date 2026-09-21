import { db } from "@/db";
import {
  campaigns,
  contentItems,
  creativeAssets,
  videoScripts,
  pipelineRuns,
  type ContentItem,
} from "@/db/schema";
import { eq } from "drizzle-orm";
import { runStrategyAgent } from "./strategy-agent";
import { runContentAgent } from "./content-agent";
import { runCreativeAgent } from "./creative-agent";
import { runVideoAgent } from "./video-agent";
import { runQAAgent } from "./qa-agent";
import { AgentConfigError } from "./client";
import { submitForApproval } from "@/lib/content/submit";

export type PipelineStep = {
  step: "strategy" | "content" | "creative" | "video" | "qa" | "submit";
  status: "success" | "failed" | "skipped";
  detail?: string;
  error?: string;
};

export type PipelineParams = {
  agencyId: string;
  brandId: string;
  campaignId: string | null;
  platform: string;
  contentType: "POST" | "REEL" | "STORY" | "CAROUSEL" | "VIDEO" | "ARTICLE";
  brief: string;
  runCreative: boolean;
  runVideo: boolean; // caller decides based on contentType, but pipeline re-checks too
  runQA: boolean;
  autoSubmit: boolean;
  actorId: string;
  actorName: string;
};

const VIDEO_CONTENT_TYPES = new Set(["REEL", "VIDEO"]);

/** Whether the video step makes sense for this content type at all —
 * exposed separately so the UI and the pipeline agree on this without
 * duplicating the rule, and so it's testable without calling any agent. */
export function isVideoApplicable(contentType: string): boolean {
  return VIDEO_CONTENT_TYPES.has(contentType);
}

/** Orchestrates the five agents in sequence for one piece of content,
 * recording each step's outcome. A missing ANTHROPIC_API_KEY aborts
 * immediately after the first failing step (every later step would fail
 * identically) rather than repeating the same error five times. Any
 * other single-step failure is recorded and the pipeline continues —
 * Creative/Video/QA are independent enough that one failing shouldn't
 * block the others. */
export async function runPipeline(params: PipelineParams): Promise<{
  runId: string;
  status: "COMPLETED" | "FAILED";
  contentItemId: string | null;
  steps: PipelineStep[];
}> {
  const steps: PipelineStep[] = [];

  const [run] = await db
    .insert(pipelineRuns)
    .values({
      agencyId: params.agencyId,
      brandId: params.brandId,
      campaignId: params.campaignId,
      status: "RUNNING",
      steps: "[]",
      createdById: params.actorId,
    })
    .returning();

  async function persist(status: "RUNNING" | "COMPLETED" | "FAILED", contentItemId?: string) {
    await db
      .update(pipelineRuns)
      .set({
        status,
        steps: JSON.stringify(steps),
        ...(contentItemId ? { contentItemId } : {}),
        ...(status !== "RUNNING" ? { completedAt: new Date() } : {}),
      })
      .where(eq(pipelineRuns.id, run.id));
  }

  // --- 1. Strategy (only if this campaign doesn't already have one) ---
  if (params.campaignId) {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, params.campaignId))
      .limit(1);

    if (campaign && !campaign.strategyGeneratedAt) {
      try {
        const result = await runStrategyAgent({
          brandId: params.brandId,
          campaignName: campaign.name,
          objective: campaign.objective ?? "",
        });
        await db
          .update(campaigns)
          .set({
            contentPillars: JSON.stringify(result.contentPillars),
            keyMessages: result.keyMessages,
            strategyNotes: result.strategyNotes,
            strategyGeneratedAt: new Date(),
          })
          .where(eq(campaigns.id, params.campaignId));
        steps.push({ step: "strategy", status: "success", detail: result.keyMessages });
      } catch (err) {
        if (err instanceof AgentConfigError) {
          steps.push({ step: "strategy", status: "failed", error: err.message });
          await persist("FAILED");
          return { runId: run.id, status: "FAILED", contentItemId: null, steps };
        }
        steps.push({
          step: "strategy",
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });
        // Non-fatal — content generation still works without a fresh strategy.
      }
    } else {
      steps.push({
        step: "strategy",
        status: "skipped",
        detail: campaign?.strategyGeneratedAt ? "Campaign already has a strategy" : "No campaign",
      });
    }
  } else {
    steps.push({ step: "strategy", status: "skipped", detail: "No campaign selected" });
  }

  // --- 2. Content (required — nothing after this makes sense without it) ---
  let contentItem: ContentItem;
  try {
    const result = await runContentAgent({
      brandId: params.brandId,
      campaignId: params.campaignId,
      platform: params.platform,
      contentType: params.contentType,
      brief: params.brief,
    });

    const [created] = await db
      .insert(contentItems)
      .values({
        agencyId: params.agencyId,
        brandId: params.brandId,
        campaignId: params.campaignId,
        title: result.title,
        body: result.body,
        hashtags: JSON.stringify(result.hashtags),
        platform: params.platform,
        contentType: params.contentType,
        status: "DRAFT",
        sourceBrief: params.brief,
        generatedByAgent: "pipeline",
        createdById: params.actorId,
      })
      .returning();
    contentItem = created;
    steps.push({ step: "content", status: "success", detail: result.title });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    steps.push({ step: "content", status: "failed", error: message });
    await persist("FAILED");
    return { runId: run.id, status: "FAILED", contentItemId: null, steps };
  }

  await persist("RUNNING", contentItem.id);

  // --- 3. Creative (optional) ---
  if (params.runCreative) {
    try {
      const result = await runCreativeAgent({
        brandId: params.brandId,
        platform: params.platform,
        contentType: params.contentType,
        postBody: contentItem.body,
      });
      await db.insert(creativeAssets).values({
        contentItemId: contentItem.id,
        briefText: result.briefText,
        visualDirection: result.visualDirection,
        suggestedAspectRatio: result.suggestedAspectRatio,
        createdById: params.actorId,
      });
      steps.push({ step: "creative", status: "success", detail: result.briefText.slice(0, 80) });
    } catch (err) {
      if (err instanceof AgentConfigError) {
        steps.push({ step: "creative", status: "failed", error: err.message });
        await persist("FAILED", contentItem.id);
        return { runId: run.id, status: "FAILED", contentItemId: contentItem.id, steps };
      }
      steps.push({
        step: "creative",
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  } else {
    steps.push({ step: "creative", status: "skipped" });
  }

  // --- 4. Video (optional, only if the content type is video-shaped) ---
  if (params.runVideo && isVideoApplicable(params.contentType)) {
    try {
      const result = await runVideoAgent({
        brandId: params.brandId,
        platform: params.platform,
        brief: params.brief,
      });
      await db.insert(videoScripts).values({
        contentItemId: contentItem.id,
        title: result.title,
        scenes: JSON.stringify(result.scenes),
        totalDurationSeconds: String(result.totalDurationSeconds),
        createdById: params.actorId,
      });
      steps.push({ step: "video", status: "success", detail: `${result.scenes.length} scenes` });
    } catch (err) {
      if (err instanceof AgentConfigError) {
        steps.push({ step: "video", status: "failed", error: err.message });
        await persist("FAILED", contentItem.id);
        return { runId: run.id, status: "FAILED", contentItemId: contentItem.id, steps };
      }
      steps.push({
        step: "video",
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  } else {
    steps.push({
      step: "video",
      status: "skipped",
      detail: !params.runVideo ? "Not requested" : "Not a video content type",
    });
  }

  // --- 5. QA (optional) ---
  let qaPassed = false;
  if (params.runQA) {
    try {
      const hashtags: string[] = JSON.parse(contentItem.hashtags ?? "[]");
      const result = await runQAAgent({
        brandId: params.brandId,
        platform: params.platform,
        body: contentItem.body,
        hashtags,
      });
      await db
        .update(contentItems)
        .set({
          qaStatus: result.status,
          qaSummary: result.summary,
          qaIssues: JSON.stringify(result.issues),
          qaRanAt: new Date(),
        })
        .where(eq(contentItems.id, contentItem.id));
      qaPassed = result.status === "PASS" || result.status === "WARNINGS";
      steps.push({ step: "qa", status: "success", detail: result.status });
    } catch (err) {
      if (err instanceof AgentConfigError) {
        steps.push({ step: "qa", status: "failed", error: err.message });
        await persist("FAILED", contentItem.id);
        return { runId: run.id, status: "FAILED", contentItemId: contentItem.id, steps };
      }
      steps.push({
        step: "qa",
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  } else {
    steps.push({ step: "qa", status: "skipped" });
  }

  // --- 6. Auto-submit (optional, gated on QA having passed if QA ran at all) ---
  if (params.autoSubmit) {
    const qaWasRequested = params.runQA;
    const qaBlocksSubmit = qaWasRequested && !qaPassed;
    if (qaBlocksSubmit) {
      steps.push({ step: "submit", status: "skipped", detail: "QA did not pass" });
    } else {
      try {
        await submitForApproval(contentItem, params.actorId, params.actorName);
        steps.push({ step: "submit", status: "success" });
      } catch (err) {
        steps.push({
          step: "submit",
          status: "failed",
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }
  } else {
    steps.push({ step: "submit", status: "skipped", detail: "Not requested" });
  }

  await persist("COMPLETED", contentItem.id);
  return { runId: run.id, status: "COMPLETED", contentItemId: contentItem.id, steps };
}
