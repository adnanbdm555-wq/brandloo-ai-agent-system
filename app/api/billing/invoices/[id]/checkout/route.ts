import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { invoices } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { createCheckoutSession, PaymentConfigError } from "@/lib/billing/safepay";
import { canManageUsers } from "@/lib/roles";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canManageUsers(session.user.role)) {
    return NextResponse.json(
      { error: "Only a Super Admin or Admin can make payments" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, id), eq(invoices.agencyId, session.user.agencyId)))
    .limit(1);
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }
  if (invoice.status === "PAID") {
    return NextResponse.json({ error: "This invoice is already paid" }, { status: 400 });
  }

  try {
    const checkoutUrl = await createCheckoutSession({
      invoiceNumber: invoice.invoiceNumber,
      amountPkr: invoice.amount,
    });
    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("Safepay checkout error:", err);
    return NextResponse.json(
      { error: "Couldn't start checkout. Try again." },
      { status: 502 }
    );
  }
}
