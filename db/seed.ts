// Dev/testing helper only — never run automatically, and never run against
// a production database. Creates one demo account so you can log in and
// look around without going through /register first.
//
//   npm run db:seed

import "dotenv/config";
import { db } from "./index";
import { users, agencies, subscriptions } from "./schema";
import { hashPassword } from "../lib/password";
import { eq } from "drizzle-orm";
import { createInviteCode } from "./id";
import { TRIAL_DAYS, STANDARD_PLAN_PRICE_PKR, BILLING_PERIOD_DAYS } from "../lib/billing/config";

async function main() {
  const email = "demo@adpulse.test";

  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    console.log(`Demo account already exists: ${email}`);
    return;
  }

  const [agency] = await db
    .insert(agencies)
    .values({ name: "Demo Agency", inviteCode: createInviteCode() })
    .returning();

  const passwordHash = await hashPassword("demo12345");
  await db.insert(users).values({
    agencyId: agency.id,
    name: "Demo Admin",
    email,
    passwordHash,
    role: "SUPER_ADMIN",
    isPlatformAdmin: true,
  });

  await db.insert(subscriptions).values({
    agencyId: agency.id,
    status: "TRIALING",
    priceAmount: STANDARD_PLAN_PRICE_PKR,
    billingPeriodDays: BILLING_PERIOD_DAYS,
    trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000),
  });

  console.log("Demo account created:");
  console.log(`  email:    ${email}`);
  console.log(`  password: demo12345`);
  console.log(`  agency invite code: ${agency.inviteCode}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
