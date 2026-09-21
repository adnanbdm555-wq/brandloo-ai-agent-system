import { auth } from "@/auth";
import { db } from "@/db";
import { brands, contentItems, socialAccounts } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { PublishingCenter } from "@/components/PublishingCenter";

export default async function PublishingPage() {
  const session = await auth();
  const agencyId = session!.user.agencyId;
  const [allBrands, allAccounts, approvedItems, publishedItems] = await Promise.all([
    db.select().from(brands).where(eq(brands.agencyId, agencyId)).orderBy(desc(brands.createdAt)),
    db.select().from(socialAccounts).where(eq(socialAccounts.agencyId, agencyId)),
    db
      .select()
      .from(contentItems)
      .where(and(eq(contentItems.status, "APPROVED"), eq(contentItems.agencyId, agencyId)))
      .orderBy(desc(contentItems.updatedAt)),
    db
      .select()
      .from(contentItems)
      .where(and(eq(contentItems.status, "PUBLISHED"), eq(contentItems.agencyId, agencyId)))
      .orderBy(desc(contentItems.publishedAt)),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl text-ink">Publishing</h1>
      <p className="mt-1 text-sm text-muted">
        Confirm what's gone live. Real platform publishing (posting
        automatically) needs OAuth apps registered with each platform —
        see the README.
      </p>
      <div className="mt-6">
        <PublishingCenter
          brands={allBrands}
          accounts={allAccounts}
          initialReady={approvedItems}
          initialPublished={publishedItems}
        />
      </div>
    </div>
  );
}
