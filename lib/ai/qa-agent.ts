import { callAI } from "./client";
import { buildBrandContext } from "./brand-context";

export type QAOutput = {
  status: "PASS" | "WARNINGS" | "FAIL";
  summary: string;
  issues: string[];
};

const SYSTEM_PROMPT = `You are the QA Agent inside a social media operations platform. You review one piece of drafted content against its brand's guardrails before it goes to human approval.

Check for:
- Any forbidden word used (this alone is a FAIL)
- Claims or facts not supported by the brand's knowledge base (invented statistics, offers, or promises)
- Tone/voice mismatch with the brand's stated tone of voice
- Missing required hashtags, if any are set
- Platform fit (length, style) for the stated platform

Be a careful editor, not a nitpicker — minor stylistic preferences are not issues. Only flag things that would actually embarrass the brand or breach a stated rule.

Respond with ONLY a JSON object, no markdown fences, no preamble, in this exact shape:
{"status": "PASS" | "WARNINGS" | "FAIL", "summary": "one sentence overall verdict", "issues": ["specific issue 1", "specific issue 2"]}
"issues" should be empty if status is PASS.`;

export async function runQAAgent(params: {
  brandId: string;
  platform: string;
  body: string;
  hashtags: string[];
}): Promise<QAOutput> {
  const context = await buildBrandContext(params.brandId);
  if (!context) {
    throw new Error("Brand not found");
  }

  const rawText = await callAI({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Brand context:\n${context.contextText}\n\nPlatform: ${params.platform}\nDraft post:\n${params.body}\n\nHashtags used: ${params.hashtags.join(", ") || "none"}`,
    maxTokens: 800,
  });

  const cleaned = rawText.trim().replace(/^```json\s*|\s*```$/g, "");
  const parsed = JSON.parse(cleaned) as QAOutput;

  return {
    status: parsed.status ?? "WARNINGS",
    summary: parsed.summary ?? "",
    issues: Array.isArray(parsed.issues) ? parsed.issues : [],
  };
}
