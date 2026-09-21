import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { contentItems, videoScripts } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { canEdit } from "@/lib/roles";
import { runVideoAgent } from "@/lib/ai/video-agent";
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
    .from(videoScripts)
    .where(eq(videoScripts.contentItemId, id))
    .orderBy(desc(videoScripts.createdAt));
  return NextResponse.json({ scripts: rows });
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
      { error: "You don't have permission to generate video scripts" },
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
    const result = await runVideoAgent({
      brandId: item.brandId,
      platform: item.platform ?? "",
      brief: item.sourceBrief || item.body,
    });

    const [created] = await db
      .insert(videoScripts)
      .values({
        contentItemId: id,
        title: result.title,
        scenes: JSON.stringify(result.scenes),
        totalDurationSeconds: String(result.totalDurationSeconds),
        createdById: session.user.id,
      })
      .returning();

    return NextResponse.json({ script: created }, { status: 201 });
  } catch (err) {
    if (err instanceof AgentConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("Video Agent error:", err);
    return NextResponse.json(
      { error: "The Video Agent couldn't complete this run. Try again." },
      { status: 502 }
    );
  }
}
