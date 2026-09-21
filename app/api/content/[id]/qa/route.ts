import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { contentItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { canEdit } from "@/lib/roles";
import { runQAAgent } from "@/lib/ai/qa-agent";
import { AgentConfigError } from "@/lib/ai/client";

function parseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
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
      { error: "You don't have permission to run QA checks" },
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
    const result = await runQAAgent({
      brandId: item.brandId,
      platform: item.platform ?? "",
      body: item.body,
      hashtags: parseArray(item.hashtags),
    });

    const [updated] = await db
      .update(contentItems)
      .set({
        qaStatus: result.status,
        qaSummary: result.summary,
        qaIssues: JSON.stringify(result.issues),
        qaRanAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(contentItems.id, id))
      .returning();

    return NextResponse.json({ content: updated });
  } catch (err) {
    if (err instanceof AgentConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("QA Agent error:", err);
    return NextResponse.json(
      { error: "The QA Agent couldn't complete this run. Try again." },
      { status: 502 }
    );
  }
}
