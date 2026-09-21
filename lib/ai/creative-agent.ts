import { getAnthropicClient, AGENT_MODEL } from "./client";
import { buildBrandContext } from "./brand-context";

export type CreativeOutput = {
  briefText: string;
  visualDirection: string;
  suggestedAspectRatio: string;
};

const SYSTEM_PROMPT = `You are the Creative Agent inside a social media operations platform. Given a brand's visual identity and a specific post's caption, you write a creative brief a designer can execute directly — you do not generate the image yourself.

Ground the direction in the brand's actual colors, tone, and visual guidelines where given. Be concrete: name the shot type, composition, focal subject, mood, and how the caption's message should show up visually (text overlay, product placement, etc.). Suggest an aspect ratio appropriate for the platform.

Respond with ONLY a JSON object, no markdown fences, no preamble, in this exact shape:
{"briefText": "the full creative brief, 3-6 sentences", "visualDirection": "short comma-separated direction: colors, mood, composition", "suggestedAspectRatio": "e.g. 4:5 or 9:16 or 1:1"}`;

export async function runCreativeAgent(params: {
  brandId: string;
  platform: string;
  contentType: string;
  postBody: string;
}): Promise<CreativeOutput> {
  const context = await buildBrandContext(params.brandId);
  if (!context) {
    throw new Error("Brand not found");
  }

  const client = getAnthropicClient();

  const message = await client.messages.create({
    model: AGENT_MODEL,
    max_tokens: 700,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Brand context:\n${context.contextText}\n\nPlatform: ${params.platform}\nContent type: ${params.contentType}\nPost caption this creative supports:\n${params.postBody}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Creative Agent returned no text");
  }

  const cleaned = textBlock.text.trim().replace(/^```json\s*|\s*```$/g, "");
  const parsed = JSON.parse(cleaned) as CreativeOutput;

  return {
    briefText: parsed.briefText ?? "",
    visualDirection: parsed.visualDirection ?? "",
    suggestedAspectRatio: parsed.suggestedAspectRatio ?? "4:5",
  };
}
