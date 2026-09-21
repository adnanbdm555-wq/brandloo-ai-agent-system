import { auth } from "@/auth";
import { db } from "@/db";
import { brands, campaigns, contentTemplates } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Pipeline } from "@/components/Pipeline";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<{ brandId?: string; campaignId?: string }>;
}) {
  const { brandId, campaignId } = await searchParams;
  const session = await auth();
  const agencyId = session!.user.agencyId;

  const [allBrands, allCampaigns, allTemplates] = await Promise.all([
    db.select().from(brands).where(eq(brands.agencyId, agencyId)).orderBy(desc(brands.createdAt)),
    db.select().from(campaigns).where(eq(campaigns.agencyId, agencyId)),
    db.select().from(contentTemplates).where(eq(contentTemplates.agencyId, agencyId)),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl text-ink">Pipeline</h1>
      <p className="mt-1 text-sm text-muted">
        Run Strategy, Content, Creative, Video, and QA as one chained step
        instead of visiting each Studio separately.
      </p>
      <div className="mt-6">
        <Pipeline
          brands={allBrands}
          campaigns={allCampaigns}
          templates={allTemplates}
          defaultBrandId={brandId}
          defaultCampaignId={campaignId}
        />
      </div>
    </div>
  );
}
