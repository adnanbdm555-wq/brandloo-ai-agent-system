import { auth } from "@/auth";
import { db } from "@/db";
import { brands, campaigns, contentTemplates, automationRules } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Automation } from "@/components/Automation";
import { canEdit } from "@/lib/roles";

export default async function AutomationPage() {
  const session = await auth();
  const agencyId = session!.user.agencyId;
  const [allBrands, allCampaigns, allTemplates, allRules] = await Promise.all([
    db.select().from(brands).where(eq(brands.agencyId, agencyId)).orderBy(desc(brands.createdAt)),
    db.select().from(campaigns).where(eq(campaigns.agencyId, agencyId)),
    db.select().from(contentTemplates).where(eq(contentTemplates.agencyId, agencyId)),
    db
      .select()
      .from(automationRules)
      .where(eq(automationRules.agencyId, agencyId))
      .orderBy(desc(automationRules.createdAt)),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl text-ink">Automation</h1>
      <p className="mt-1 text-sm text-muted">
        Have the Content Agent draft posts on a schedule. Drafts still need
        review — automation writes, it doesn't publish.
      </p>
      <div className="mt-6">
        <Automation
          brands={allBrands}
          campaigns={allCampaigns}
          templates={allTemplates}
          initialRules={allRules}
          canEdit={canEdit(session?.user.role)}
        />
      </div>
    </div>
  );
}
