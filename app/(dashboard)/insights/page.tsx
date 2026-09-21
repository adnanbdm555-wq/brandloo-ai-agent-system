import { auth } from "@/auth";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { InsightsPanel } from "@/components/InsightsPanel";

export default async function InsightsPage() {
  const session = await auth();
  const allBrands = await db
    .select()
    .from(brands)
    .where(eq(brands.agencyId, session!.user.agencyId))
    .orderBy(desc(brands.createdAt));

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl text-ink">AI Insights</h1>
      <p className="mt-1 text-sm text-muted">
        Patterns from your actual published performance — the agent won't
        guess when there isn't enough real data yet.
      </p>
      <div className="mt-6">
        <InsightsPanel brands={allBrands} />
      </div>
    </div>
  );
}
