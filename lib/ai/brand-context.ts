import { db } from "@/db";
import { brands, brandKnowledge } from "@/db/schema";
import { eq } from "drizzle-orm";

function parseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

/** Pulls everything known about a brand — profile fields and every
 * knowledge base entry — into one text block agents can be grounded on.
 * This is what stops agents from inventing brand facts: they're told to
 * only use what's here. */
export async function buildBrandContext(brandId: string): Promise<{
  brandName: string;
  contextText: string;
} | null> {
  const [brand] = await db.select().from(brands).where(eq(brands.id, brandId)).limit(1);
  if (!brand) return null;

  const knowledge = await db
    .select()
    .from(brandKnowledge)
    .where(eq(brandKnowledge.brandId, brandId));

  const lines: string[] = [];
  lines.push(`Brand: ${brand.name}`);
  if (brand.industry) lines.push(`Industry: ${brand.industry}`);
  if (brand.description) lines.push(`Description: ${brand.description}`);
  if (brand.targetAudience) lines.push(`Target audience: ${brand.targetAudience}`);
  if (brand.products) lines.push(`Products: ${brand.products}`);
  if (brand.services) lines.push(`Services: ${brand.services}`);
  if (brand.usp) lines.push(`USP: ${brand.usp}`);
  if (brand.toneOfVoice) lines.push(`Tone of voice: ${brand.toneOfVoice}`);
  if (brand.communicationStyle)
    lines.push(`Communication style: ${brand.communicationStyle}`);
  if (brand.primaryLanguage) lines.push(`Primary language: ${brand.primaryLanguage}`);
  if (brand.secondaryLanguage)
    lines.push(`Secondary language: ${brand.secondaryLanguage}`);

  const platforms = parseArray(brand.socialPlatforms);
  if (platforms.length) lines.push(`Social platforms: ${platforms.join(", ")}`);

  const competitors = parseArray(brand.competitors);
  if (competitors.length) lines.push(`Competitors: ${competitors.join(", ")}`);

  const approvedCtas = parseArray(brand.approvedCtas);
  if (approvedCtas.length) lines.push(`Approved CTAs: ${approvedCtas.join(", ")}`);

  const requiredHashtags = parseArray(brand.requiredHashtags);
  if (requiredHashtags.length)
    lines.push(`Required hashtags: ${requiredHashtags.join(", ")}`);

  const forbiddenWords = parseArray(brand.forbiddenWords);
  if (forbiddenWords.length)
    lines.push(`FORBIDDEN WORDS (never use these): ${forbiddenWords.join(", ")}`);

  if (knowledge.length > 0) {
    lines.push("");
    lines.push("Knowledge base:");
    for (const entry of knowledge) {
      lines.push(`- [${entry.category}] ${entry.title}: ${entry.content}`);
    }
  }

  return { brandName: brand.name, contextText: lines.join("\n") };
}
