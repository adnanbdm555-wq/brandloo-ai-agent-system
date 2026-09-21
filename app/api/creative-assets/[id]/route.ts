import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { creativeAssets, contentItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { canEdit } from "@/lib/roles";
import { z } from "zod";

const schema = z.object({ imageUrl: z.string().url() });

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canEdit(session.user.role)) {
    return NextResponse.json({ error: "You don't have permission to do this" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid URL" }, { status: 400 });
  }

  // creativeAssets has no agencyId of its own — verify agency through its
  // parent content item instead.
  const [asset] = await db
    .select({ id: creativeAssets.id, contentItemId: creativeAssets.contentItemId })
    .from(creativeAssets)
    .where(eq(creativeAssets.id, id))
    .limit(1);
  if (!asset) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const [item] = await db
    .select({ id: contentItems.id })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.id, asset.contentItemId),
        eq(contentItems.agencyId, session.user.agencyId)
      )
    )
    .limit(1);
  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [updated] = await db
    .update(creativeAssets)
    .set({ imageUrl: parsed.data.imageUrl })
    .where(eq(creativeAssets.id, id))
    .returning();

  return NextResponse.json({ asset: updated });
}
