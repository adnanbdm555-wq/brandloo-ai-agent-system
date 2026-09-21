import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, subscriptions, agencies, users } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { verifyAndParseWebhook, PaymentConfigError } from "@/lib/billing/safepay";
import { manuallyActivate } from "@/lib/billing/actions";
import { sendEmail } from "@/lib/email/client";
import { paymentConfirmedEmail } from "@/lib/email/billing-templates";

// Called by Safepay itself when a payment completes — not by a logged-in
// user, so there's no session check here. Authenticity comes from
// verifyAndParseWebhook's signature check instead.
export async function POST(req: Request) {
  try {
    const result = await verifyAndParseWebhook(req);
    if (!result) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
    }

    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.invoiceNumber, result.orderId))
      .limit(1);
    if (!invoice) {
      // Acknowledge with 200 so Safepay doesn't retry indefinitely for an
      // invoice number that doesn't exist on our side.
      return NextResponse.json({ received: true, matched: false });
    }
    if (invoice.status === "PAID") {
      return NextResponse.json({ received: true, alreadyPaid: true });
    }

    await db
      .update(invoices)
      .set({ status: "PAID", paidAt: new Date(), safepayPaymentRef: result.paymentRef })
      .where(eq(invoices.id, invoice.id));

    // "Automatic" activation — same underlying action a platform admin
    // triggers manually, just called by the system instead of a click.
    // actorId null (vs. a real user id) makes that distinction visible
    // in the data: null = the webhook did this, not a person.
    const updated = await manuallyActivate(invoice.subscriptionId, null);

    if (updated) {
      const [agency] = await db
        .select()
        .from(agencies)
        .where(eq(agencies.id, invoice.agencyId))
        .limit(1);
      const [owner] = await db
        .select({ email: users.email })
        .from(users)
        .where(and(eq(users.agencyId, invoice.agencyId), eq(users.role, "SUPER_ADMIN")))
        .limit(1);

      if (owner && agency) {
        const { subject, html } = paymentConfirmedEmail({
          agencyName: agency.name,
          invoiceNumber: invoice.invoiceNumber,
        });
        // Best-effort — don't fail the webhook over an email hiccup.
        await sendEmail({ to: owner.email, subject, html }).catch(() => {});
      }
    }

    return NextResponse.json({ received: true, matched: true });
  } catch (err) {
    if (err instanceof PaymentConfigError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    console.error("Safepay webhook error:", err);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
