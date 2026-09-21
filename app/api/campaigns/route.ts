import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { campaigns, brands } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { campaignSchema } from "@/lib/validation";
import { canEdit } from "@/lib/roles";

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
        .from(campaigns)
        .where(
          and(eq(campaigns.brandId, brandId), eq(campaigns.agencyId, session.user.agencyId))
        )
        .orderBy(desc(campaigns.createdAt))
    : await db
        .select()
        .from(campaigns)
        .where(eq(campaigns.agencyId, session.user.agencyId))
        .orderBy(desc(campaigns.createdAt));

  return NextResponse.json({ campaigns: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEdit(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to create campaigns" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = campaignSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const [brand] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(and(eq(brands.id, data.brandId), eq(brands.agencyId, session.user.agencyId)))
    .limit(1);
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const [created] = await db
    .insert(campaigns)
    .values({
      agencyId: session.user.agencyId,
      brandId: data.brandId,
      name: data.name,
      objective: data.objective || null,
      status: data.status || "DRAFT",
      startDate: data.startDate ? new Date(data.startDate) : null,
      endDate: data.endDate ? new Date(data.endDate) : null,
      targetPlatforms: data.targetPlatforms
        ? JSON.stringify(data.targetPlatforms)
        : null,
      createdById: session.user.id,
    })
    .returning();

  return NextResponse.json({ campaign: created }, { status: 201 });
}
