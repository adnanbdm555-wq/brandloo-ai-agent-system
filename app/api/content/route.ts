import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { contentItems } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get("brandId");

  const rows = brandId
    ? await db
        .select()
        .from(contentItems)
        .where(
          and(
            eq(contentItems.brandId, brandId),
            eq(contentItems.agencyId, session.user.agencyId)
          )
        )
        .orderBy(desc(contentItems.createdAt))
    : await db
        .select()
        .from(contentItems)
        .where(eq(contentItems.agencyId, session.user.agencyId))
        .orderBy(desc(contentItems.createdAt));

  return NextResponse.json({ content: rows });
}
