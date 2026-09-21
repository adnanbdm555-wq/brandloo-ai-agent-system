import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { brandKnowledge } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { canEdit } from "@/lib/roles";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; knowledgeId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEdit(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to remove brand knowledge" },
      { status: 403 }
    );
  }

  const { knowledgeId } = await params;
  const [deleted] = await db
    .delete(brandKnowledge)
    .where(
      and(
        eq(brandKnowledge.id, knowledgeId),
        eq(brandKnowledge.agencyId, session.user.agencyId)
      )
    )
    .returning({ id: brandKnowledge.id });

  if (!deleted) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
