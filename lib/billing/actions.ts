import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { BILLING_PERIOD_DAYS } from "./config";

/** Manual overrides a platform admin triggers by hand from
 * /platform-admin — distinct from runBillingCycle()'s automatic
 * progression. lastChangedById records who did it, so it's clear in
 * the data which subscriptions were touched by a person vs. the cron. */

export async function manuallyActivate(subscriptionId: string, actorId: string | null) {
  const currentPeriodEnd = new Date(
    Date.now() + BILLING_PERIOD_DAYS * 24 * 60 * 60 * 1000
  );
  const [updated] = await db
    .update(subscriptions)
    .set({
      status: "ACTIVE",
      currentPeriodEnd,
      lastPaymentAt: new Date(),
      gracePeriodEndsAt: null,
      lastChangedById: actorId,
    })
    .where(eq(subscriptions.id, subscriptionId))
    .returning();
  return updated;
}

export async function manuallySuspend(subscriptionId: string, actorId: string | null) {
  const [updated] = await db
    .update(subscriptions)
    .set({ status: "SUSPENDED", lastChangedById: actorId })
    .where(eq(subscriptions.id, subscriptionId))
    .returning();
  return updated;
}

export async function manuallyCancel(subscriptionId: string, actorId: string | null) {
  const [updated] = await db
    .update(subscriptions)
    .set({ status: "CANCELED", lastChangedById: actorId })
    .where(eq(subscriptions.id, subscriptionId))
    .returning();
  return updated;
}

export async function extendTrial(subscriptionId: string, actorId: string | null, extraDays: number) {
  const [current] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1);
  if (!current) return null;

  const base = current.trialEndsAt > new Date() ? current.trialEndsAt : new Date();
  const trialEndsAt = new Date(base.getTime() + extraDays * 24 * 60 * 60 * 1000);

  const [updated] = await db
    .update(subscriptions)
    .set({
      status: "TRIALING",
      trialEndsAt,
      trialReminderSentAt: null,
      gracePeriodEndsAt: null,
      lastChangedById: actorId,
    })
    .where(eq(subscriptions.id, subscriptionId))
    .returning();
  return updated;
}
