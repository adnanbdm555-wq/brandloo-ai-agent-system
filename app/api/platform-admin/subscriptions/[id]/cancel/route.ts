import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { manuallyCancel } from "@/lib/billing/actions";

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
  
  const updated = await manuallyCancel(id, session.user.id);
  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ subscription: updated });
}
