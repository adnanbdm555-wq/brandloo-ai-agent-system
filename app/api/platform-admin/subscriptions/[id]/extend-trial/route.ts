import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { extendTrial } from "@/lib/billing/actions";
import { z } from "zod";

const schema = z.object({ days: z.number().int().min(1).max(365).default(7) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isPlatformAdmin) {
    return NextResponse.json({ error: "Platform admin access only" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  const days = parsed.success ? parsed.data.days : 7;

  const updated = await extendTrial(id, session.user.id, days);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ subscription: updated });
}
