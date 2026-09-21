import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { automationRules } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { canEdit } from "@/lib/roles";
import { z } from "zod";

const updateSchema = z.object({
  enabled: z.boolean().optional(),
});

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
      { error: "You don't have permission to edit automations" },
      { status: 403 }
    );
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const [updated] = await db
    .update(automationRules)
    .set({ ...parsed.data })
    .where(
      and(eq(automationRules.id, id), eq(automationRules.agencyId, session.user.agencyId))
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ rule: updated });
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
      { error: "You don't have permission to delete automations" },
      { status: 403 }
    );
  }
  const { id } = await params;
  const [deleted] = await db
    .delete(automationRules)
    .where(
      and(eq(automationRules.id, id), eq(automationRules.agencyId, session.user.agencyId))
    )
    .returning({ id: automationRules.id });
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
