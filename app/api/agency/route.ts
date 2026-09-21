import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { agencies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { canManageUsers } from "@/lib/roles";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageUsers(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to view agency settings" },
      { status: 403 }
    );
  }

  const [agency] = await db
    .select()
    .from(agencies)
    .where(eq(agencies.id, session.user.agencyId))
    .limit(1);

  return NextResponse.json({ agency });
}
