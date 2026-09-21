import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { contentItems, brands } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { contentGenerateSchema } from "@/lib/validation";
import { canEdit } from "@/lib/roles";
import { runContentAgent } from "@/lib/ai/content-agent";
import { AgentConfigError } from "@/lib/ai/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEdit(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to generate content" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = contentGenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const [brand] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(and(eq(brands.id, data.brandId), eq(brands.agencyId, session.user.agencyId)))
    .limit(1);
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  try {
    const result = await runContentAgent({
      brandId: data.brandId,
      campaignId: data.campaignId || null,
      platform: data.platform,
      contentType: data.contentType,
      brief: data.brief,
    });

    const [created] = await db
      .insert(contentItems)
      .values({
        agencyId: session.user.agencyId,
        brandId: data.brandId,
        campaignId: data.campaignId || null,
        title: result.title,
        body: result.body,
        hashtags: JSON.stringify(result.hashtags),
        platform: data.platform,
        contentType: data.contentType,
        status: "DRAFT",
        sourceBrief: data.brief,
        generatedByAgent: "content-agent-v1",
        createdById: session.user.id,
      })
      .returning();

    return NextResponse.json({ content: created }, { status: 201 });
  } catch (err) {
    if (err instanceof AgentConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("Content Agent error:", err);
    return NextResponse.json(
      { error: "The Content Agent couldn't complete this run. Try again." },
      { status: 502 }
    );
  }
}
