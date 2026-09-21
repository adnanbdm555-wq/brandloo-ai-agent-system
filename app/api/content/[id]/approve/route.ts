import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { contentItems, contentApprovalEvents } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { canApprove } from "@/lib/roles";
import { approvalActionSchema } from "@/lib/validation";
import { notifyUser } from "@/lib/notifications";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canApprove(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to approve content" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = approvalActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const [item] = await db
    .select()
    .from(contentItems)
    .where(and(eq(contentItems.id, id), eq(contentItems.agencyId, session.user.agencyId)))
    .limit(1);
  if (!item) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }

  const [updated] = await db
    .update(contentItems)
    .set({ status: "APPROVED", updatedAt: new Date() })
    .where(eq(contentItems.id, id))
    .returning();

  await db.insert(contentApprovalEvents).values({
    contentItemId: id,
    action: "APPROVED",
    notes: parsed.data.notes || null,
    actorId: session.user.id,
  });

  if (item.createdById !== session.user.id) {
    await notifyUser({
      userId: item.createdById,
      type: "CONTENT_APPROVED",
      title: `"${item.title}" was approved`,
      body: `${session.user.name} approved this post.`,
      link: "/content-calendar",
    });
  }

  return NextResponse.json({ content: updated });
}
