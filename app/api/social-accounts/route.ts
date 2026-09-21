import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { socialAccounts, brands } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { canEdit } from "@/lib/roles";
import { z } from "zod";

const createSchema = z.object({
  brandId: z.string().min(1),
  platform: z.enum(["INSTAGRAM", "FACEBOOK", "LINKEDIN", "YOUTUBE", "TIKTOK", "X"]),
  accountName: z.string().min(1, "Account name is required").max(200),
  profileUrl: z.string().max(500).optional().or(z.literal("")),
});

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
        .from(socialAccounts)
        .where(
          and(
            eq(socialAccounts.brandId, brandId),
            eq(socialAccounts.agencyId, session.user.agencyId)
          )
        )
        .orderBy(desc(socialAccounts.createdAt))
    : await db
        .select()
        .from(socialAccounts)
        .where(eq(socialAccounts.agencyId, session.user.agencyId))
        .orderBy(desc(socialAccounts.createdAt));

  return NextResponse.json({ accounts: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEdit(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to add social accounts" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const [brand] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(and(eq(brands.id, parsed.data.brandId), eq(brands.agencyId, session.user.agencyId)))
    .limit(1);
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const [created] = await db
    .insert(socialAccounts)
    .values({
      agencyId: session.user.agencyId,
      brandId: parsed.data.brandId,
      platform: parsed.data.platform,
      accountName: parsed.data.accountName,
      profileUrl: parsed.data.profileUrl || null,
      createdById: session.user.id,
    })
    .returning();

  return NextResponse.json({ account: created }, { status: 201 });
}
