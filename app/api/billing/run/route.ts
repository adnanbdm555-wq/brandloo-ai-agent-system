import { NextResponse } from "next/server";
import { runBillingCycle } from "@/lib/billing/cycle";

/** Called on a timer by an external scheduler (same pattern as
 * api/automation/run) — checks every subscription and advances trials
 * to invoices to suspensions as time passes. Protected by CRON_SECRET,
 * not a user session. */
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not set. Add it to enable automatic billing." },
      { status: 503 }
    );
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const events = await runBillingCycle();
  return NextResponse.json({ checked: true, events });
}
