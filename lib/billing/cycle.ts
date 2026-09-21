import { db } from "@/db";
import { subscriptions, invoices, agencies, users } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { nextInvoiceNumber } from "./invoices";
import { sendEmail } from "@/lib/email/client";
import {
  trialEndingSoonEmail,
  trialEndedInvoiceEmail,
  accountSuspendedEmail,
} from "@/lib/email/billing-templates";
import {
  REMINDER_DAYS_BEFORE_TRIAL_END,
  GRACE_PERIOD_DAYS,
  BILLING_PERIOD_DAYS,
} from "./config";

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

type CycleEvent = { agencyId: string; agencyName: string; action: string };

/** The one function the billing cron (and the manual "Run billing check"
 * admin button) both call. Walks every subscription and advances it
 * through TRIALING → PAST_DUE → SUSPENDED (or ACTIVE renewal → PAST_DUE)
 * as time passes — this is what "automatic" means here. Manual overrides
 * from the Platform Admin panel (lib/billing/actions.ts) sit alongside
 * this, not inside it. */
export async function runBillingCycle(): Promise<CycleEvent[]> {
  const events: CycleEvent[] = [];
  const now = new Date();
  const all = await db.select().from(subscriptions);

  for (const sub of all) {
    const [agency] = await db
      .select()
      .from(agencies)
      .where(eq(agencies.id, sub.agencyId))
      .limit(1);
    if (!agency) continue;

    const billingUrl = `${APP_URL}/billing`;

    // --- TRIALING: reminder, then convert to an invoice once trial ends ---
    if (sub.status === "TRIALING") {
      const daysLeft = Math.ceil(
        (sub.trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (now >= sub.trialEndsAt) {
        const invoiceNumber = await nextInvoiceNumber();
        const dueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        await db.insert(invoices).values({
          agencyId: sub.agencyId,
          subscriptionId: sub.id,
          invoiceNumber,
          amount: sub.priceAmount,
          currency: "PKR",
          status: "PENDING",
          dueDate,
        });

        const gracePeriodEndsAt = new Date(
          now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
        );
        await db
          .update(subscriptions)
          .set({ status: "PAST_DUE", gracePeriodEndsAt })
          .where(eq(subscriptions.id, sub.id));

        const owner = await firstSuperAdminEmail(sub.agencyId);
        if (owner) {
          const { subject, html } = trialEndedInvoiceEmail({
            agencyName: agency.name,
            invoiceNumber,
            amount: sub.priceAmount,
            currency: "PKR",
            dueDate: dueDate.toLocaleDateString(),
            billingUrl,
          });
          await sendEmail({ to: owner, subject, html });
        }
        events.push({ agencyId: agency.id, agencyName: agency.name, action: "trial_ended_invoiced" });
      } else if (daysLeft <= REMINDER_DAYS_BEFORE_TRIAL_END && !sub.trialReminderSentAt) {
        const owner = await firstSuperAdminEmail(sub.agencyId);
        if (owner) {
          const { subject, html } = trialEndingSoonEmail({
            agencyName: agency.name,
            daysLeft: Math.max(daysLeft, 0),
            billingUrl,
          });
          await sendEmail({ to: owner, subject, html });
        }
        await db
          .update(subscriptions)
          .set({ trialReminderSentAt: now })
          .where(eq(subscriptions.id, sub.id));
        events.push({ agencyId: agency.id, agencyName: agency.name, action: "trial_reminder_sent" });
      }
      continue;
    }

    // --- ACTIVE: renew, or roll into PAST_DUE once the period ends ---
    if (sub.status === "ACTIVE" && sub.currentPeriodEnd && now >= sub.currentPeriodEnd) {
      const invoiceNumber = await nextInvoiceNumber();
      const dueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      await db.insert(invoices).values({
        agencyId: sub.agencyId,
        subscriptionId: sub.id,
        invoiceNumber,
        amount: sub.priceAmount,
        currency: "PKR",
        status: "PENDING",
        dueDate,
      });
      const gracePeriodEndsAt = new Date(
        now.getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000
      );
      await db
        .update(subscriptions)
        .set({ status: "PAST_DUE", gracePeriodEndsAt })
        .where(eq(subscriptions.id, sub.id));

      const owner = await firstSuperAdminEmail(sub.agencyId);
      if (owner) {
        const { subject, html } = trialEndedInvoiceEmail({
          agencyName: agency.name,
          invoiceNumber,
          amount: sub.priceAmount,
          currency: "PKR",
          dueDate: dueDate.toLocaleDateString(),
          billingUrl,
        });
        await sendEmail({ to: owner, subject, html });
      }
      events.push({ agencyId: agency.id, agencyName: agency.name, action: "period_ended_invoiced" });
      continue;
    }

    // --- PAST_DUE: suspend once the grace period is over and still unpaid ---
    if (
      sub.status === "PAST_DUE" &&
      sub.gracePeriodEndsAt &&
      now >= sub.gracePeriodEndsAt
    ) {
      await db
        .update(subscriptions)
        .set({ status: "SUSPENDED" })
        .where(eq(subscriptions.id, sub.id));

      const owner = await firstSuperAdminEmail(sub.agencyId);
      if (owner) {
        const { subject, html } = accountSuspendedEmail({
          agencyName: agency.name,
          billingUrl,
        });
        await sendEmail({ to: owner, subject, html });
      }
      events.push({ agencyId: agency.id, agencyName: agency.name, action: "suspended" });
    }
  }

  return events;
}

async function firstSuperAdminEmail(agencyId: string): Promise<string | null> {
  const [admin] = await db
    .select({ email: users.email })
    .from(users)
    .where(and(eq(users.agencyId, agencyId), eq(users.role, "SUPER_ADMIN")))
    .limit(1);
  return admin?.email ?? null;
}

export { BILLING_PERIOD_DAYS };
