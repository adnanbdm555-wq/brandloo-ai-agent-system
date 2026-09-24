import Anthropic from "@anthropic-ai/sdk";

let anthropicClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AgentConfigError(
      "Neither GEMINI_API_KEY nor ANTHROPIC_API_KEY is set. Add an API key in Vercel to enable AI agents."
    );
  }
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

export class AgentConfigError extends Error {}

export const AGENT_MODEL = "claude-3-5-sonnet-20241022";
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

/**
 * Universal AI caller supporting both Google Gemini API and Anthropic Claude API.
 * Defaults to Google Gemini if GEMINI_API_KEY or GOOGLE_API_KEY is set.
 */
export async function callAI(params: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
}): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (geminiKey) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${geminiKey}`;
    const payload = {
      system_instruction: {
        parts: [{ text: params.systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: params.userPrompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: params.maxTokens || 1500,
        temperature: 0.7,
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Google Gemini API error (${res.status}): ${errBody || res.statusText}`);
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error("Google Gemini returned an empty response.");
    }
    return text;
  }

  if (anthropicKey) {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: AGENT_MODEL,
      max_tokens: params.maxTokens || 1200,
      system: params.systemPrompt,
      messages: [{ role: "user", content: params.userPrompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Anthropic Claude returned no text.");
    }
    return textBlock.text;
  }

  throw new AgentConfigError(
    "GEMINI_API_KEY (or ANTHROPIC_API_KEY) is not set. Add it in Vercel Settings -> Environment Variables."
  );
}
