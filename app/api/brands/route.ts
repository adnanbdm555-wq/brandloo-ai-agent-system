import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { brandSchema } from "@/lib/validation";
import { canEdit } from "@/lib/roles";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(brands)
    .where(eq(brands.agencyId, session.user.agencyId))
    .orderBy(desc(brands.createdAt));

  return NextResponse.json({ brands: rows });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEdit(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to create brands" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = brandSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const data = parsed.data;

  const [created] = await db
    .insert(brands)
    .values({
      agencyId: session.user.agencyId,
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
      createdById: session.user.id,
    })
    .returning();

  return NextResponse.json({ brand: created }, { status: 201 });
}
