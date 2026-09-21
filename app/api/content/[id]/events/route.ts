import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { contentApprovalEvents, contentItems, users } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";

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
    .select({
      id: contentApprovalEvents.id,
      action: contentApprovalEvents.action,
      notes: contentApprovalEvents.notes,
      createdAt: contentApprovalEvents.createdAt,
      actorName: users.name,
    })
    .from(contentApprovalEvents)
    .leftJoin(users, eq(contentApprovalEvents.actorId, users.id))
    .where(eq(contentApprovalEvents.contentItemId, id))
    .orderBy(desc(contentApprovalEvents.createdAt));

  return NextResponse.json({ events: rows });
}
