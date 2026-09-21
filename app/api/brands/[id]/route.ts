import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { brandSchema } from "@/lib/validation";
import { canEdit } from "@/lib/roles";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [brand] = await db
    .select()
    .from(brands)
    .where(and(eq(brands.id, id), eq(brands.agencyId, session.user.agencyId)))
    .limit(1);

  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  return NextResponse.json({ brand });
}

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
      { error: "You don't have permission to edit brands" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const [updated] = await db
    .update(brands)
    .set({
      name: data.name,
      industry: data.industry || null,
      website: data.website || null,
      description: data.description || null,
      targetAudience: data.targetAudience || null,
      products: data.products || null,
      services: data.services || null,
      usp: data.usp || null,
      brandColors: data.brandColors ? JSON.stringify(data.brandColors) : null,
      typography: data.typography || null,
      logoUrl: data.logoUrl || null,
      toneOfVoice: data.toneOfVoice || null,
      communicationStyle: data.communicationStyle || null,
      primaryLanguage: data.primaryLanguage || "English",
      secondaryLanguage: data.secondaryLanguage || null,
      socialPlatforms: data.socialPlatforms
        ? JSON.stringify(data.socialPlatforms)
        : null,
      competitors: data.competitors ? JSON.stringify(data.competitors) : null,
      approvedCtas: data.approvedCtas
        ? JSON.stringify(data.approvedCtas)
        : null,
      forbiddenWords: data.forbiddenWords
        ? JSON.stringify(data.forbiddenWords)
        : null,
      requiredHashtags: data.requiredHashtags
        ? JSON.stringify(data.requiredHashtags)
        : null,
      location: data.location || null,
      contactInformation: data.contactInformation || null,
      updatedAt: new Date(),
    })
    .where(and(eq(brands.id, id), eq(brands.agencyId, session.user.agencyId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  return NextResponse.json({ brand: updated });
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
      { error: "You don't have permission to delete brands" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const [deleted] = await db
    .delete(brands)
    .where(and(eq(brands.id, id), eq(brands.agencyId, session.user.agencyId)))
    .returning({ id: brands.id });

  if (!deleted) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
