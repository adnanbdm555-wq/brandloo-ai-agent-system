import { auth } from "@/auth";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { CampaignForm } from "@/components/CampaignForm";

export default async function NewCampaignPage({
  searchParams,
}: {
  searchParams: Promise<{ brandId?: string }>;
}) {
  const { brandId } = await searchParams;
  const session = await auth();
  const allBrands = await db
    .select()
    .from(brands)
    .where(eq(brands.agencyId, session!.user.agencyId))
    .orderBy(desc(brands.createdAt));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-ink">New campaign</h1>
      <p className="mt-1 text-sm text-muted">
        Set the objective — the Strategy Agent will turn it into content
        pillars and key messages once the campaign is created.
      </p>
      <div className="mt-6">
        <CampaignForm brands={allBrands} defaultBrandId={brandId} />
      </div>
    </div>
  );
}
