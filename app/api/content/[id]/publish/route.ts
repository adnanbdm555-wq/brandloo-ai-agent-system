import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { contentItems } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { canEdit } from "@/lib/roles";
import { z } from "zod";

const schema = z.object({
  publishedUrl: z.string().url("Enter the live post URL"),
  socialAccountId: z.string().optional().or(z.literal("")),
});

// Marks approved content as published, recording the live URL and which
// account it went out on. This is a manual confirmation, not an automated
// post — see README for what a real Publishing Agent integration needs
// (OAuth apps registered with each platform).
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
      { error: "You don't have permission to mark content as published" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const [item] = await db
    .select()
    .from(contentItems)
    .where(and(eq(contentItems.id, id), eq(contentItems.agencyId, session.user.agencyId)))
    .limit(1);
  if (!item) {
    return NextResponse.json({ error: "Content not found" }, { status: 404 });
  }
  if (item.status !== "APPROVED") {
    return NextResponse.json(
      { error: "Only approved content can be marked as published" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(contentItems)
    .set({
      status: "PUBLISHED",
      publishedAt: new Date(),
      publishedUrl: parsed.data.publishedUrl,
      socialAccountId: parsed.data.socialAccountId || null,
      updatedAt: new Date(),
    })
    .where(eq(contentItems.id, id))
    .returning();

  return NextResponse.json({ content: updated });
}
