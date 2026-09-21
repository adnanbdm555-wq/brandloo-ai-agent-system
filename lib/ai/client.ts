import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new AgentConfigError(
      "ANTHROPIC_API_KEY is not set. Add it to your environment to enable AI agents."
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

/** Thrown when an agent can't run because required config (e.g. the API
 * key) is missing — API routes catch this specifically and return a clear
 * 503 instead of a generic 500, so the UI can show "not configured" rather
 * than "something broke". */
export class AgentConfigError extends Error {}

export const AGENT_MODEL = "claude-sonnet-5";
