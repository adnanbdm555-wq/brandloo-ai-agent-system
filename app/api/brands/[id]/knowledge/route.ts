import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { brandKnowledge, brands } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { knowledgeSchema } from "@/lib/validation";
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
  const rows = await db
    .select()
    .from(brandKnowledge)
    .where(
      and(
        eq(brandKnowledge.brandId, id),
        eq(brandKnowledge.agencyId, session.user.agencyId)
      )
    )
    .orderBy(desc(brandKnowledge.createdAt));

  return NextResponse.json({ knowledge: rows });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEdit(session.user.role)) {
    return NextResponse.json(
      { error: "You don't have permission to add brand knowledge" },
      { status: 403 }
    );
  }

  const { id } = await params;

  const [brand] = await db
    .select({ id: brands.id })
    .from(brands)
    .where(and(eq(brands.id, id), eq(brands.agencyId, session.user.agencyId)))
    .limit(1);
  if (!brand) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = knowledgeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const [created] = await db
    .insert(brandKnowledge)
    .values({
      agencyId: session.user.agencyId,
      brandId: id,
      category: parsed.data.category,
      title: parsed.data.title,
      content: parsed.data.content,
      createdById: session.user.id,
    })
    .returning();

  return NextResponse.json({ knowledge: created }, { status: 201 });
}
