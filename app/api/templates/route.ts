import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { contentTemplates, brands } from "@/db/schema";
import { and, desc, eq, isNull, or } from "drizzle-orm";
import { canEdit } from "@/lib/roles";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  category: z.string().min(1, "Category is required").max(100),
  briefTemplate: z.string().min(3, "Give the template some content").max(2000),
  brandId: z.string().optional().or(z.literal("")),
  defaultPlatform: z.string().optional().or(z.literal("")),
  defaultContentType: z
    .enum(["POST", "REEL", "STORY", "CAROUSEL", "VIDEO", "ARTICLE"])
    .default("POST"),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const brandId = searchParams.get("brandId");

  // Global templates (brandId null) always show; brand-specific ones only
  // show when that brand is selected.
  const rows = await db
    .select()
    .from(contentTemplates)
    .where(
      and(
        eq(contentTemplates.agencyId, session.user.agencyId),
        brandId
          ? or(isNull(contentTemplates.brandId), eq(contentTemplates.brandId, brandId))
          : undefined
      )
    )
    .orderBy(desc(contentTemplates.createdAt));

  return NextResponse.json({ templates: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEdit(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to create templates" },
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

  if (parsed.data.brandId) {
    const [brand] = await db
      .select({ id: brands.id })
      .from(brands)
      .where(
        and(eq(brands.id, parsed.data.brandId), eq(brands.agencyId, session.user.agencyId))
      )
      .limit(1);
    if (!brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }
  }

  const [created] = await db
    .insert(contentTemplates)
    .values({
      agencyId: session.user.agencyId,
      brandId: parsed.data.brandId || null,
      name: parsed.data.name,
      category: parsed.data.category,
      briefTemplate: parsed.data.briefTemplate,
      defaultPlatform: parsed.data.defaultPlatform || null,
      defaultContentType: parsed.data.defaultContentType,
      createdById: session.user.id,
    })
    .returning();

  return NextResponse.json({ template: created }, { status: 201 });
}
