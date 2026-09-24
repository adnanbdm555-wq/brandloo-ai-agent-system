import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, agencies, subscriptions } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation";
import { createInviteCode } from "@/db/id";
import { TRIAL_DAYS, STANDARD_PLAN_PRICE_PKR, BILLING_PERIOD_DAYS } from "@/lib/billing/config";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1);

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    if (parsed.data.mode === "create") {
      // The very first person to ever register on this install — before
      // them, the users table is empty — becomes the platform admin (you,
      // the operator). Everyone after, including Super Admins of other
      // agencies, is just an agency-scoped user.
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users);
      const isFirstEverUser = count === 0;

      // New agency — this person becomes its Super Admin.
      const [agency] = await db
        .insert(agencies)
        .values({ name: parsed.data.agencyName, inviteCode: createInviteCode() })
        .returning();

      const [created] = await db
        .insert(users)
        .values({
          agencyId: agency.id,
          name,
          email: normalizedEmail,
          passwordHash,
          role: "SUPER_ADMIN",
          isPlatformAdmin: isFirstEverUser,
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          isPlatformAdmin: users.isPlatformAdmin,
        });

      const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
      await db.insert(subscriptions).values({
        agencyId: agency.id,
        status: "TRIALING",
        priceAmount: STANDARD_PLAN_PRICE_PKR,
        billingPeriodDays: BILLING_PERIOD_DAYS,
        trialEndsAt,
      });

      return NextResponse.json({ user: created, agency }, { status: 201 });
    }

    // Joining an existing agency via invite code.
    const [agency] = await db
      .select()
      .from(agencies)
      .where(eq(agencies.inviteCode, parsed.data.inviteCode.trim()))
      .limit(1);

    if (!agency) {
      return NextResponse.json({ error: "Invite code not recognized" }, { status: 404 });
    }

    const [created] = await db
      .insert(users)
      .values({
        agencyId: agency.id,
        name,
        email: normalizedEmail,
        passwordHash,
        role: "MARKETING_MANAGER",
      })
      .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

    return NextResponse.json({ user: created, agency }, { status: 201 });
  } catch (err: any) {
    console.error("Registration error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Database error during registration. Ensure tables exist." },
      { status: 500 }
    );
  }
}
