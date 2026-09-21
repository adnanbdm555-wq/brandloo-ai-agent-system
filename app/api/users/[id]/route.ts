import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { canManageUsers, ROLES } from "@/lib/roles";
import { z } from "zod";

const updateSchema = z.object({
  role: z.enum(ROLES),
});

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageUsers(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to manage teammates" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const [target] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.agencyId, session.user.agencyId)))
    .limit(1);
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Never leave an agency with zero Super Admins.
  if (target.role === "SUPER_ADMIN" && parsed.data.role !== "SUPER_ADMIN") {
    const superAdmins = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.agencyId, session.user.agencyId), eq(users.role, "SUPER_ADMIN")));
    if (superAdmins.length <= 1) {
      return NextResponse.json(
        { error: "This agency needs at least one Super Admin" },
        { status: 400 }
      );
    }
  }

  const [updated] = await db
    .update(users)
    .set({ role: parsed.data.role, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

  return NextResponse.json({ user: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageUsers(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to manage teammates" },
      { status: 403 }
    );
  }

  const { id } = await params;
  if (id === session.user.id) {
    return NextResponse.json({ error: "You can't remove your own account" }, { status: 400 });
  }

  const [target] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, id), eq(users.agencyId, session.user.agencyId)))
    .limit(1);
  if (!target) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (target.role === "SUPER_ADMIN") {
    const superAdmins = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.agencyId, session.user.agencyId), eq(users.role, "SUPER_ADMIN")));
    if (superAdmins.length <= 1) {
      return NextResponse.json(
        { error: "This agency needs at least one Super Admin" },
        { status: 400 }
      );
    }
  }

  await db.delete(users).where(eq(users.id, id));
  return NextResponse.json({ ok: true });
}
