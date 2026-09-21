import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { agencies, subscriptions, users, invoices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.isPlatformAdmin) {
    return NextResponse.json({ error: "Platform admin access only" }, { status: 403 });
  }

  const allAgencies = await db.select().from(agencies).orderBy(desc(agencies.createdAt));

  const result = await Promise.all(
    allAgencies.map(async (agency) => {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.agencyId, agency.id))
        .limit(1);

      const memberCount = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.agencyId, agency.id));

      const recentInvoices = subscription
        ? await db
            .select()
            .from(invoices)
            .where(eq(invoices.subscriptionId, subscription.id))
            .orderBy(desc(invoices.createdAt))
            .limit(5)
        : [];

      return {
        agency,
        subscription: subscription ?? null,
        memberCount: memberCount.length,
        recentInvoices,
      };
    })
  );

  return NextResponse.json({ agencies: result });
}
