import { auth } from "@/auth";
import { db } from "@/db";
import { brands, campaigns } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ContentStudio } from "@/components/ContentStudio";

export default async function ContentStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ brandId?: string; campaignId?: string }>;
}) {
  const { brandId, campaignId } = await searchParams;
  const session = await auth();
  const agencyId = session!.user.agencyId;
  const [allBrands, allCampaigns] = await Promise.all([
    db.select().from(brands).where(eq(brands.agencyId, agencyId)).orderBy(desc(brands.createdAt)),
    db.select().from(campaigns).where(eq(campaigns.agencyId, agencyId)).orderBy(desc(campaigns.createdAt)),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl text-ink">Content Studio</h1>
      <p className="mt-1 text-sm text-muted">
        The Content Agent writes from the brand's knowledge base and, if you
        pick one, the campaign's strategy.
      </p>
      <div className="mt-6">
        <ContentStudio
          brands={allBrands}
          campaigns={allCampaigns}
          defaultBrandId={brandId}
          defaultCampaignId={campaignId}
        />
      </div>
    </div>
  );
}
