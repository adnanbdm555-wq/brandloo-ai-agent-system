import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { contentTemplates } from "@/db/schema";
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
      { error: "You don't have permission to delete templates" },
      { status: 403 }
    );
  }
  const { id } = await params;
  const [deleted] = await db
    .delete(contentTemplates)
    .where(and(eq(contentTemplates.id, id), eq(contentTemplates.agencyId, session.user.agencyId)))
    .returning({ id: contentTemplates.id });
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
