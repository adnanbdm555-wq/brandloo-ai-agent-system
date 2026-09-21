import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { automationRules, brands } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { canEdit } from "@/lib/roles";
import { z } from "zod";

const createSchema = z.object({
  brandId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(200),
  scheduleDayOfWeek: z.number().int().min(0).max(6).nullable().optional(),
  scheduleHourUtc: z.number().int().min(0).max(23).default(9),
  campaignId: z.string().optional().or(z.literal("")),
  templateId: z.string().optional().or(z.literal("")),
  platform: z.string().min(1, "Platform is required"),
  contentType: z
    .enum(["POST", "REEL", "STORY", "CAROUSEL", "VIDEO", "ARTICLE"])
    .default("POST"),
  briefOverride: z.string().optional().or(z.literal("")),
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
        .from(automationRules)
        .where(
          and(
            eq(automationRules.brandId, brandId),
            eq(automationRules.agencyId, session.user.agencyId)
          )
        )
        .orderBy(desc(automationRules.createdAt))
    : await db
        .select()
        .from(automationRules)
        .where(eq(automationRules.agencyId, session.user.agencyId))
        .orderBy(desc(automationRules.createdAt));

  return NextResponse.json({ rules: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEdit(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to create automations" },
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
  const data = parsed.data;

  if (!data.templateId && !data.briefOverride) {
    return NextResponse.json(
      { error: "Pick a template or write a brief for this automation to use" },
      { status: 400 }
    );
  }

  const [brand] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(and(eq(brands.id, data.brandId), eq(brands.agencyId, session.user.agencyId)))
    .limit(1);
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const [created] = await db
    .insert(automationRules)
    .values({
      agencyId: session.user.agencyId,
      brandId: data.brandId,
      name: data.name,
      scheduleDayOfWeek: data.scheduleDayOfWeek ?? null,
      scheduleHourUtc: data.scheduleHourUtc,
      campaignId: data.campaignId || null,
      templateId: data.templateId || null,
      platform: data.platform,
      contentType: data.contentType,
      briefOverride: data.briefOverride || null,
      createdById: session.user.id,
    })
    .returning();

  return NextResponse.json({ rule: created }, { status: 201 });
}
