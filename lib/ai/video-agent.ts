import { callAI } from "./client";
import { buildBrandContext } from "./brand-context";

export type VideoScene = {
  scene: number;
  visual: string;
  voiceover: string;
  onScreenText: string;
  durationSeconds: number;
};

export type VideoOutput = {
  title: string;
  scenes: VideoScene[];
  totalDurationSeconds: number;
};

const SYSTEM_PROMPT = `You are the Video Agent inside a social media operations platform. Given a brand and a post brief, you write a scene-by-scene video script/storyboard a video editor can shoot and cut directly — you do not generate the video file yourself.

Write 3-6 scenes. For each: what's on screen, a short voiceover line (or "none" if silent), any on-screen text overlay, and a duration in seconds. Keep the total under 60 seconds unless the brief clearly calls for longer. Ground every claim in the brand's actual information — never invent product facts.

Respond with ONLY a JSON object, no markdown fences, no preamble, in this exact shape:
{"title": "short internal title", "scenes": [{"scene": 1, "visual": "...", "voiceover": "...", "onScreenText": "...", "durationSeconds": 5}], "totalDurationSeconds": 30}`;

export async function runVideoAgent(params: {
  brandId: string;
  platform: string;
  brief: string;
}): Promise<VideoOutput> {
  const context = await buildBrandContext(params.brandId);
  if (!context) {
    throw new Error("Brand not found");
  }

  const rawText = await callAI({
    systemPrompt: SYSTEM_PROMPT,
    userPrompt: `Brand context:\n${context.contextText}\n\nPlatform: ${params.platform}\nBrief: ${params.brief}`,
    maxTokens: 1400,
  });

  const cleaned = rawText.trim().replace(/^```json\s*|\s*```$/g, "");
  const parsed = JSON.parse(cleaned) as VideoOutput;

  return {
    title: parsed.title ?? params.brief.slice(0, 60),
    scenes: Array.isArray(parsed.scenes) ? parsed.scenes : [],
    totalDurationSeconds: parsed.totalDurationSeconds ?? 0,
  };
}
