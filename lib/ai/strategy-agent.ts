import { getAnthropicClient, AGENT_MODEL } from "./client";
import { buildBrandContext } from "./brand-context";

export type StrategyOutput = {
  contentPillars: string[];
  keyMessages: string;
  strategyNotes: string;
};

const SYSTEM_PROMPT = `You are the Strategy Agent inside a social media operations platform used by a marketing agency. Given a brand's full profile and a campaign objective, you produce a content strategy: 3-5 content pillars (themes to post around), a short paragraph of key messages, and brief strategy notes (cadence, angle, what to lean into).

Ground everything strictly in the brand information given to you. Never invent facts, statistics, or claims about the brand that weren't provided. Respect any forbidden words listed. Write in the brand's stated tone of voice where one is given.

Respond with ONLY a JSON object, no markdown fences, no preamble, in this exact shape:
{"contentPillars": ["...", "..."], "keyMessages": "...", "strategyNotes": "..."}`;

export async function runStrategyAgent(params: {
  brandId: string;
  campaignName: string;
  objective: string;
}): Promise<StrategyOutput> {
  const context = await buildBrandContext(params.brandId);
  if (!context) {
    throw new Error("Brand not found");
  }

  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: AGENT_MODEL,
    max_tokens: 1200,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Brand context:\n${context.contextText}\n\nCampaign: ${params.campaignName}\nObjective: ${params.objective || "Not specified — infer a sensible objective from the brand context."}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Strategy Agent returned no text");
  }

  const cleaned = textBlock.text.trim().replace(/^```json\s*|\s*```$/g, "");
  const parsed = JSON.parse(cleaned) as StrategyOutput;

  return {
    contentPillars: Array.isArray(parsed.contentPillars) ? parsed.contentPillars : [],
    keyMessages: parsed.keyMessages ?? "",
    strategyNotes: parsed.strategyNotes ?? "",
  };
}
