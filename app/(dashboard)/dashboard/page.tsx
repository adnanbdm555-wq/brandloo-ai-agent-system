import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { brands, campaigns, contentItems, aiInsights } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { DashboardCard } from "@/components/DashboardCard";
import { ArrowUpRight, Building2 } from "lucide-react";

function parseRecommendations(value: string): string[] {
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default async function DashboardPage() {
  const session = await auth();
  const agencyId = session?.user?.agencyId;

  if (!agencyId) {
    redirect("/login");
  }

  let allBrands: any[] = [];
  let allCampaigns: any[] = [];
  let allContent: any[] = [];
  let recentInsights: any[] = [];

  try {
    const results = await Promise.all([
      db.select().from(brands).where(eq(brands.agencyId, agencyId)),
      db.select().from(campaigns).where(eq(campaigns.agencyId, agencyId)),
      db.select().from(contentItems).where(eq(contentItems.agencyId, agencyId)),
      db
        .select()
        .from(aiInsights)
        .where(eq(aiInsights.agencyId, agencyId))
        .orderBy(desc(aiInsights.createdAt))
        .limit(1),
    ]);
    allBrands = results[0] ?? [];
    allCampaigns = results[1] ?? [];
    allContent = results[2] ?? [];
    recentInsights = results[3] ?? [];
  } catch (err) {
    console.error("Error loading dashboard data:", err);
  }

  const latestInsight = recentInsights[0] ?? null;
  const insightBrandName = latestInsight
    ? allBrands.find((b) => b.id === latestInsight.brandId)?.name
    : null;
  const activeCampaigns = allCampaigns.filter((c) => c.status === "ACTIVE").length;
  const pendingApproval = allContent.filter((c) => c.status === "PENDING_APPROVAL").length;
  const scheduledPosts = allContent.filter(
    (c) => c.status === "APPROVED" && c.scheduledDate
  ).length;
  const publishedPosts = allContent.filter((c) => c.status === "PUBLISHED").length;
  const totalReach = allContent.reduce((sum, c) => sum + (c.reach ?? 0), 0);
  const totalEngagement = allContent.reduce(
    (sum, c) => sum + (c.likes ?? 0) + (c.comments ?? 0) + (c.shares ?? 0),
    0
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <DashboardCard label="Total Brands" value={allBrands.length} />
        <DashboardCard label="Active Campaigns" value={activeCampaigns} />
        <DashboardCard label="Content Created" value={allContent.length} />
        <DashboardCard label="Pending Approval" value={pendingApproval} />
        <DashboardCard label="Scheduled Posts" value={scheduledPosts} />
        <DashboardCard label="Published Posts" value={publishedPosts} />
        <DashboardCard label="Total Reach" value={totalReach.toLocaleString()} />
        <DashboardCard label="Engagement" value={totalEngagement.toLocaleString()} />
        <DashboardCard label="Leads" value="—" phaseLabel="Needs CRM" />
        <DashboardCard label="Conversion Rate" value="—" phaseLabel="Needs CRM" />
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Your brands</h2>
            <Link
              href="/brands"
              className="flex items-center gap-1 text-sm font-medium text-indigo hover:text-indigo-dark"
            >
              View all
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {allBrands.length === 0 ? (
            <div className="mt-6 flex flex-col items-center rounded-lg border border-dashed border-border py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-light text-indigo">
                <Building2 className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-medium text-ink">No brands yet</p>
              <p className="mt-1 max-w-xs text-sm text-muted">
                Add your first brand to start building its knowledge base.
              </p>
              <Link
                href="/brands/new"
                className="mt-4 rounded-lg bg-indigo px-4 py-2 text-sm font-medium text-white hover:bg-indigo-dark"
              >
                Add a brand
              </Link>
            </div>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {allBrands.slice(0, 6).map((brand) => (
                <Link
                  key={brand.id}
                  href={`/brands/${brand.id}`}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 hover:opacity-70"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{brand.name}</p>
                    <p className="text-xs text-muted">
                      {brand.industry || "No industry set"}
                    </p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted" />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
          <h2 className="font-display text-lg text-ink">AI Recommendations</h2>
          {latestInsight ? (
            <div className="mt-4">
              <p className="text-xs text-muted">
                {insightBrandName} · from {latestInsight.dataPointsUsed} posts
              </p>
              <ul className="mt-2 space-y-2">
                {parseRecommendations(latestInsight.recommendations)
                  .slice(0, 3)
                  .map((r, i) => (
                    <li key={i} className="flex gap-2 text-sm text-ink/80">
                      <span className="text-amber-dark">•</span>
                      {r}
                    </li>
                  ))}
              </ul>
              <Link
                href="/insights"
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-indigo hover:text-indigo-dark"
              >
                View all insights
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-amber-light px-4 py-4 text-sm text-ink/70">
              Publish a few posts, log real metrics, then{" "}
              <Link href="/insights" className="font-medium text-indigo hover:text-indigo-dark">
                generate insights
              </Link>{" "}
              for a brand.
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg text-ink">Performance over time</h2>
            <p className="mt-1 text-sm text-muted">
              Reach by post, and every published post's real metrics.
            </p>
          </div>
          <Link
            href="/analytics"
            className="flex items-center gap-1 text-sm font-medium text-indigo hover:text-indigo-dark"
          >
            Open Analytics
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {publishedPosts === 0 && (
          <div className="mt-5 flex h-32 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted">
            No published posts yet
          </div>
        )}
      </div>
    </div>
  );
}
