import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { contentItems, creativeAssets } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { canEdit } from "@/lib/roles";
import { runCreativeAgent } from "@/lib/ai/creative-agent";
import { AgentConfigError } from "@/lib/ai/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  // Verify the parent content item belongs to this agency before
  // returning anything scoped to it.
  const [item] = await db
    .select({ id: contentItems.id })
    .from(contentItems)
    .where(and(eq(contentItems.id, id), eq(contentItems.agencyId, session.user.agencyId)))
    .limit(1);
  if (!item) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(creativeAssets)
    .where(eq(creativeAssets.contentItemId, id))
    .orderBy(desc(creativeAssets.createdAt));
  return NextResponse.json({ assets: rows });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEdit(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to generate creative briefs" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const [item] = await db
    .select()
    .from(contentItems)
    .where(and(eq(contentItems.id, id), eq(contentItems.agencyId, session.user.agencyId)))
    .limit(1);
  if (!item) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  try {
    const result = await runCreativeAgent({
      brandId: item.brandId,
      platform: item.platform ?? "",
      contentType: item.contentType,
      postBody: item.body,
    });

    const [created] = await db
      .insert(creativeAssets)
      .values({
        contentItemId: id,
        briefText: result.briefText,
        visualDirection: result.visualDirection,
        suggestedAspectRatio: result.suggestedAspectRatio,
        createdById: session.user.id,
      })
      .returning();

    return NextResponse.json({ asset: created }, { status: 201 });
  } catch (err) {
    if (err instanceof AgentConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("Creative Agent error:", err);
    return NextResponse.json(
      { error: "The Creative Agent couldn't complete this run. Try again." },
      { status: 502 }
    );
  }
}
