import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { campaigns, brands } from "@/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Plus, Megaphone } from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-canvas text-muted",
  ACTIVE: "bg-success-light text-success",
  PAUSED: "bg-amber-light text-amber-dark",
  COMPLETED: "bg-indigo-light text-indigo",
};

export default async function CampaignsPage() {
  const session = await auth();
  const rows = await db
    .select({
      id: campaigns.id,
      name: campaigns.name,
      status: campaigns.status,
      objective: campaigns.objective,
      strategyGeneratedAt: campaigns.strategyGeneratedAt,
      brandId: campaigns.brandId,
      brandName: brands.name,
    })
    .from(campaigns)
    .leftJoin(brands, eq(campaigns.brandId, brands.id))
    .where(eq(campaigns.agencyId, session!.user.agencyId))
    .orderBy(desc(campaigns.createdAt));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Campaigns</h1>
          <p className="mt-1 text-sm text-muted">
            Each campaign can generate its own strategy and content.
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="flex items-center gap-1.5 rounded-lg bg-indigo px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-dark"
        >
          <Plus className="h-4 w-4" />
          New campaign
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-border bg-surface py-16 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-light text-indigo">
            <Megaphone className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-medium text-ink">No campaigns yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Start one to let the Strategy Agent propose content pillars for a brand.
          </p>
          <Link
            href="/campaigns/new"
            className="mt-5 rounded-lg bg-indigo px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-dark"
          >
            Create your first campaign
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((c) => (
            <Link
              key={c.id}
              href={`/campaigns/${c.id}`}
              className="flex items-center justify-between rounded-xl border border-border bg-surface p-5 shadow-card transition hover:border-indigo/40"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-display text-lg text-ink">{c.name}</h3>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.68rem] font-medium ${STATUS_STYLES[c.status] ?? "bg-canvas text-muted"}`}
                  >
                    {c.status}
                  </span>
                  {c.strategyGeneratedAt && (
                    <span className="rounded-full bg-amber-light px-2 py-0.5 text-[0.68rem] font-medium text-amber-dark">
                      Strategy ready
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {c.brandName} {c.objective ? `· ${c.objective}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
