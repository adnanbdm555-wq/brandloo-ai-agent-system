import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { campaigns, brands, contentItems } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { canEdit } from "@/lib/roles";
import { StrategyPanel } from "@/components/StrategyPanel";
import { PenSquare, ArrowUpRight, Link2 } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-canvas text-muted",
  READY: "bg-success-light text-success",
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const agencyId = session!.user.agencyId;

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.agencyId, agencyId)))
    .limit(1);
  if (!campaign) notFound();

  const [brand] = await db.select().from(brands).where(eq(brands.id, campaign.brandId)).limit(1);

  const items = await db
    .select()
    .from(contentItems)
    .where(and(eq(contentItems.campaignId, id), eq(contentItems.agencyId, agencyId)))
    .orderBy(desc(contentItems.createdAt));

  const userCanEdit = canEdit(session?.user.role);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{brand?.name}</p>
          <h1 className="font-display text-2xl text-ink">{campaign.name}</h1>
          {campaign.objective && (
            <p className="mt-1.5 max-w-2xl text-sm text-ink/70">{campaign.objective}</p>
          )}
        </div>
        {userCanEdit && (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/pipeline?campaignId=${campaign.id}&brandId=${campaign.brandId}`}
              className="flex items-center gap-1.5 rounded-lg border border-indigo px-3.5 py-2 text-sm font-medium text-indigo hover:bg-indigo-light"
            >
              <Link2 className="h-3.5 w-3.5" />
              Run pipeline
            </Link>
            <Link
              href={`/content-studio?campaignId=${campaign.id}&brandId=${campaign.brandId}`}
              className="flex items-center gap-1.5 rounded-lg bg-indigo px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-dark"
            >
              <PenSquare className="h-3.5 w-3.5" />
              Generate content
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6 space-y-5">
        <StrategyPanel campaign={campaign} canEdit={userCanEdit} />

        <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
          <h2 className="font-display text-lg text-ink">Content ({items.length})</h2>

          {items.length === 0 ? (
            <div className="mt-5 flex flex-col items-center rounded-lg border border-dashed border-border py-8 text-center">
              <p className="text-sm text-muted">No content generated for this campaign yet.</p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/content-calendar?highlight=${item.id}`}
                  className="block rounded-lg border border-border p-4 hover:border-indigo/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-ink">{item.title}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[0.63rem] font-medium ${STATUS_STYLES[item.status] ?? "bg-canvas text-muted"}`}
                        >
                          {item.status}
                        </span>
                        {item.platform && (
                          <span className="rounded border border-border px-1.5 py-0.5 text-[0.63rem] text-muted">
                            {item.platform}
                          </span>
                        )}
                      </div>
                      <p className="mt-1.5 line-clamp-2 text-sm text-ink/70">{item.body}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-muted" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
