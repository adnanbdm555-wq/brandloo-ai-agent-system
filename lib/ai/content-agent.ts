import { callAI } from "./client";
import { buildBrandContext } from "./brand-context";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ContentOutput = {
  title: string;
  body: string;
  hashtags: string[];
};

const SYSTEM_PROMPT = `You are the Content Agent inside a social media operations platform used by a marketing agency. Given a brand's full profile, an optional campaign strategy, a target platform, and a content brief, you write one ready-to-review social post.

Ground everything strictly in the brand information given to you. Never invent facts, statistics, offers, or claims about the brand that weren't provided. Never use any word listed as forbidden. Prefer the brand's approved CTAs and required hashtags where they fit naturally. Match the brand's stated tone of voice and language. Match the conventions of the target platform (e.g. concise for Instagram/X, more professional for LinkedIn).

Respond with ONLY a JSON object, no markdown fences, no preamble, in this exact shape:
{"title": "short internal label for this post", "body": "the full caption/post text", "hashtags": ["#tag1", "#tag2"]}`;

export async function runContentAgent(params: {
  brandId: string;
  campaignId?: string | null;
  platform: string;
  contentType: string;
  brief: string;
}): Promise<ContentOutput> {
  const context = await buildBrandContext(params.brandId);
  if (!context) {
    throw new Error("Brand not found");
  }

  let strategyBlock = "";
  if (params.campaignId) {
    const [campaign] = await db
      .select()
      .from(campaigns)
      .where(eq(campaigns.id, params.campaignId))
      .limit(1);
    if (campaign?.keyMessages || campaign?.contentPillars) {
      const pillars = campaign.contentPillars
        ? (JSON.parse(campaign.contentPillars) as string[]).join(", ")
        : "";
      strategyBlock = `\n\nCampaign: ${campaign.name}\nContent pillars: ${pillars}\nKey messages: ${campaign.keyMessages ?? ""}`;
    }
  }

  const rawText = await callAI({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Brand context:\n${context.contextText}${strategyBlock}\n\nTarget platform: ${params.platform}\nContent type: ${params.contentType}\nBrief: ${params.brief}`,
    maxTokens: 1000,
  });

  const cleaned = rawText.trim().replace(/^```json\s*|\s*```$/g, "");
  const parsed = JSON.parse(cleaned) as ContentOutput;

  return {
    title: parsed.title ?? params.brief.slice(0, 60),
    body: parsed.body ?? "",
    hashtags: Array.isArray(parsed.hashtags) ? parsed.hashtags : [],
  };
}
