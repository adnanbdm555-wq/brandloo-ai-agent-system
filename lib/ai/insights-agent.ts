import { getAnthropicClient, AGENT_MODEL } from "./client";
import { buildBrandContext } from "./brand-context";
import { db } from "@/db";
import { contentItems, campaigns } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export type InsightsOutput = {
  summary: string;
  observations: string[];
  recommendations: string[];
};

/** Minimum number of published posts with at least one real metric
 * entered before the agent will run. Below this, any "pattern" it found
 * would be noise dressed up as insight — so it isn't offered. */
const MIN_DATA_POINTS = 3;

export class InsufficientDataError extends Error {
  constructor(public dataPointsUsed: number, public required: number) {
    super(
      `Only ${dataPointsUsed} published post${dataPointsUsed === 1 ? "" : "s"} ${dataPointsUsed === 1 ? "has" : "have"} performance data — need at least ${required} before insights would mean anything.`
    );
  }
}

const SYSTEM_PROMPT = `You are the Insights & Optimization Agent inside a social media operations platform. You're given a brand's published posts along with the real performance metrics someone manually recorded for each (reach, impressions, likes, comments, shares, link clicks), plus which content pillar/campaign each belonged to where known.

Find genuine patterns only — which content types, platforms, or pillars performed better or worse, relative to each other in THIS data. Do not invent industry benchmarks, percentages, or comparisons to data you weren't given. If the data is too thin or mixed to support a claim, say so plainly instead of forcing a conclusion.

Respond with ONLY a JSON object, no markdown fences, no preamble, in this exact shape:
{"summary": "2-3 sentence overview of what the data shows", "observations": ["specific pattern 1", "specific pattern 2"], "recommendations": ["concrete forward-looking suggestion 1", "suggestion 2"]}`;

export async function runInsightsAgent(brandId: string): Promise<InsightsOutput & { dataPointsUsed: number }> {
  const context = await buildBrandContext(brandId);
  if (!context) {
    throw new Error("Brand not found");
  }

  const published = await db
    .select()
    .from(contentItems)
    .where(and(eq(contentItems.brandId, brandId), eq(contentItems.status, "PUBLISHED")));

  const withMetrics = published.filter(
    (item) =>
      item.reach != null ||
      item.impressions != null ||
      item.likes != null ||
      item.comments != null ||
      item.shares != null ||
      item.linkClicks != null
  );

  if (withMetrics.length < MIN_DATA_POINTS) {
    throw new InsufficientDataError(withMetrics.length, MIN_DATA_POINTS);
  }

  const campaignIds = [...new Set(withMetrics.map((i) => i.campaignId).filter(Boolean))] as string[];
  const campaignRows = campaignIds.length
    ? await db.select().from(campaigns).where(eq(campaigns.brandId, brandId))
    : [];
  const campaignById = new Map(campaignRows.map((c) => [c.id, c]));

  const dataLines = withMetrics.map((item) => {
    const campaign = item.campaignId ? campaignById.get(item.campaignId) : null;
    const metrics = [
      item.reach != null ? `reach ${item.reach}` : null,
      item.impressions != null ? `impressions ${item.impressions}` : null,
      item.likes != null ? `likes ${item.likes}` : null,
      item.comments != null ? `comments ${item.comments}` : null,
      item.shares != null ? `shares ${item.shares}` : null,
      item.linkClicks != null ? `link clicks ${item.linkClicks}` : null,
    ]
      .filter(Boolean)
      .join(", ");
    return `- "${item.title}" (${item.platform}, ${item.contentType}${campaign ? `, campaign: ${campaign.name}` : ""}): ${metrics}`;
  });

  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: AGENT_MODEL,
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Brand context:\n${context.contextText}\n\nPublished posts with performance data:\n${dataLines.join("\n")}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Insights Agent returned no text");
  }

  const cleaned = textBlock.text.trim().replace(/^```json\s*|\s*```$/g, "");
  const parsed = JSON.parse(cleaned) as InsightsOutput;

  return {
    summary: parsed.summary ?? "",
    observations: Array.isArray(parsed.observations) ? parsed.observations : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    dataPointsUsed: withMetrics.length,
  };
}
