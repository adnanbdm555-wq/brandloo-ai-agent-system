import { auth } from "@/auth";
import { db } from "@/db";
import { brands, contentItems } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { Analytics } from "@/components/Analytics";

export default async function AnalyticsPage() {
  const session = await auth();
  const agencyId = session!.user.agencyId;
  const [allBrands, publishedItems] = await Promise.all([
    db.select().from(brands).where(eq(brands.agencyId, agencyId)).orderBy(desc(brands.createdAt)),
    db
      .select()
      .from(contentItems)
      .where(and(eq(contentItems.status, "PUBLISHED"), eq(contentItems.agencyId, agencyId)))
      .orderBy(desc(contentItems.publishedAt)),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl text-ink">Analytics</h1>
      <p className="mt-1 text-sm text-muted">
        Numbers entered from what you actually see on each platform — never
        estimated.
      </p>
      <div className="mt-6">
        <Analytics brands={allBrands} initialPublished={publishedItems} />
      </div>
    </div>
  );
}
