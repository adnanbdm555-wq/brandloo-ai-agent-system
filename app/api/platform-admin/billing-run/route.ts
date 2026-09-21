import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runBillingCycle } from "@/lib/billing/cycle";

// Same logic as the cron endpoint, but triggered by a platform admin
// clicking a button — useful for testing without waiting for the timer.
export async function POST() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isPlatformAdmin) {
    return NextResponse.json({ error: "Platform admin access only" }, { status: 403 });
  }
  const events = await runBillingCycle();
  return NextResponse.json({ checked: true, events });
}
