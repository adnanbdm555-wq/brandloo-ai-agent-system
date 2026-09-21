import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { socialAccounts } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { canEdit } from "@/lib/roles";

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
      { error: "You don't have permission to remove social accounts" },
      { status: 403 }
    );
  }
  const { id } = await params;
  const [deleted] = await db
    .delete(socialAccounts)
    .where(and(eq(socialAccounts.id, id), eq(socialAccounts.agencyId, session.user.agencyId)))
    .returning({ id: socialAccounts.id });
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
