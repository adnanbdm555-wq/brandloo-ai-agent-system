import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { agencies, subscriptions, users, invoices } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { PlatformAdmin } from "@/components/PlatformAdmin";

export default async function PlatformAdminPage() {
  const session = await auth();
  if (!session?.user || !session.user.isPlatformAdmin) {
    redirect("/dashboard");
  }

  const allAgencies = await db.select().from(agencies).orderBy(desc(agencies.createdAt));

  const rows = await Promise.all(
    allAgencies.map(async (agency) => {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.agencyId, agency.id))
        .limit(1);

      const members = await db
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

      return { agency, subscription: subscription ?? null, memberCount: members.length, recentInvoices };
    })
  );

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl text-ink">Platform Admin</h1>
      <p className="mt-1 text-sm text-muted">
        Every agency on this install — trials, invoices, and manual
        activation controls.
      </p>
      <div className="mt-6">
        <PlatformAdmin initialAgencies={rows} />
      </div>
    </div>
  );
}
