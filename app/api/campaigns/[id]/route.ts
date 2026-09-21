import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { campaignSchema } from "@/lib/validation";
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
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.agencyId, session.user.agencyId)))
    .limit(1);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  return NextResponse.json({ campaign });
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
      { error: "You don't have permission to edit campaigns" },
      { status: 403 }
    );
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = campaignSchema.partial({ brandId: true, name: true }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const [updated] = await db
    .update(campaigns)
    .set({
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.objective !== undefined ? { objective: data.objective || null } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.startDate !== undefined
        ? { startDate: data.startDate ? new Date(data.startDate) : null }
        : {}),
      ...(data.endDate !== undefined
        ? { endDate: data.endDate ? new Date(data.endDate) : null }
        : {}),
      ...(data.targetPlatforms !== undefined
        ? { targetPlatforms: JSON.stringify(data.targetPlatforms) }
        : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(campaigns.id, id), eq(campaigns.agencyId, session.user.agencyId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  return NextResponse.json({ campaign: updated });
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
      { error: "You don't have permission to delete campaigns" },
      { status: 403 }
    );
  }
  const { id } = await params;
  const [deleted] = await db
    .delete(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.agencyId, session.user.agencyId)))
    .returning({ id: campaigns.id });
  if (!deleted) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
