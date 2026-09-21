import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { contentItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { contentItemUpdateSchema } from "@/lib/validation";
import { canEdit } from "@/lib/roles";

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
    .select()
    .from(contentItems)
    .where(and(eq(contentItems.id, id), eq(contentItems.agencyId, session.user.agencyId)))
    .limit(1);
  if (!item) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }
  return NextResponse.json({ content: item });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEdit(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to edit content" },
      { status: 403 }
    );
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = contentItemUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const [updated] = await db
    .update(contentItems)
    .set({
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.body !== undefined ? { body: data.body } : {}),
      ...(data.hashtags !== undefined
        ? { hashtags: JSON.stringify(data.hashtags) }
        : {}),
      ...(data.platform !== undefined ? { platform: data.platform } : {}),
      ...(data.contentType !== undefined ? { contentType: data.contentType } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.scheduledDate !== undefined
        ? { scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null }
        : {}),
      ...(data.campaignId !== undefined ? { campaignId: data.campaignId } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(contentItems.id, id), eq(contentItems.agencyId, session.user.agencyId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }
  return NextResponse.json({ content: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEdit(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to delete content" },
      { status: 403 }
    );
  }
  const { id } = await params;
  const [deleted] = await db
    .delete(contentItems)
    .where(and(eq(contentItems.id, id), eq(contentItems.agencyId, session.user.agencyId)))
    .returning({ id: contentItems.id });
  if (!deleted) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
