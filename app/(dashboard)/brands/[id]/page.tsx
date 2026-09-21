import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { brands, brandKnowledge, socialAccounts } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { canEdit } from "@/lib/roles";
import { KnowledgeBase } from "@/components/KnowledgeBase";
import { SocialAccountsPanel } from "@/components/SocialAccountsPanel";
import { Pencil, Globe, MapPin } from "lucide-react";

function parseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export default async function BrandDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const agencyId = session!.user.agencyId;

  const [brand] = await db
    .select()
    .from(brands)
    .where(and(eq(brands.id, id), eq(brands.agencyId, agencyId)))
    .limit(1);
  if (!brand) notFound();

  const knowledge = await db
    .select()
    .from(brandKnowledge)
    .where(and(eq(brandKnowledge.brandId, id), eq(brandKnowledge.agencyId, agencyId)))
    .orderBy(desc(brandKnowledge.createdAt));

  const accounts = await db
    .select()
    .from(socialAccounts)
    .where(and(eq(socialAccounts.brandId, id), eq(socialAccounts.agencyId, agencyId)))
    .orderBy(desc(socialAccounts.createdAt));

  const userCanEdit = canEdit(session?.user.role);
  const socialPlatforms = parseArray(brand.socialPlatforms);
  const requiredHashtags = parseArray(brand.requiredHashtags);
  const brandColors = parseArray(brand.brandColors);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-light font-display text-xl text-indigo">
            {brand.name.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl text-ink">{brand.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              {brand.industry && <span>{brand.industry}</span>}
              {brand.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {brand.location}
                </span>
              )}
              {brand.website && (
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  {brand.website}
                </span>
              )}
            </div>
          </div>
        </div>
        {userCanEdit && (
          <Link
            href={`/brands/${brand.id}/edit`}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-medium text-ink hover:bg-canvas"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Link>
        )}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {brand.description && (
            <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
              <h2 className="font-display text-lg text-ink">About</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink/70">
                {brand.description}
              </p>
            </div>
          )}

          <KnowledgeBase
            brandId={brand.id}
            initialEntries={knowledge}
            canEdit={userCanEdit}
          />
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
            <h2 className="font-display text-base text-ink">Voice & identity</h2>
            <dl className="mt-3 space-y-3 text-sm">
              {brand.toneOfVoice && (
                <div>
                  <dt className="text-xs text-muted">Tone of voice</dt>
                  <dd className="text-ink">{brand.toneOfVoice}</dd>
                </div>
              )}
              {brand.primaryLanguage && (
                <div>
                  <dt className="text-xs text-muted">Primary language</dt>
                  <dd className="text-ink">{brand.primaryLanguage}</dd>
                </div>
              )}
              {brand.secondaryLanguage && (
                <div>
                  <dt className="text-xs text-muted">Secondary language</dt>
                  <dd className="text-ink">{brand.secondaryLanguage}</dd>
                </div>
              )}
              {brandColors.length > 0 && (
                <div>
                  <dt className="text-xs text-muted">Brand colors</dt>
                  <dd className="mt-1.5 flex flex-wrap gap-1.5">
                    {brandColors.map((c) => (
                      <span
                        key={c}
                        className="flex items-center gap-1.5 rounded border border-border px-1.5 py-0.5 text-xs text-ink"
                      >
                        <span
                          className="h-3 w-3 rounded-full border border-border"
                          style={{ backgroundColor: c }}
                        />
                        {c}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
              {!brand.toneOfVoice &&
                !brand.primaryLanguage &&
                brandColors.length === 0 && (
                  <p className="text-sm text-muted">Not set yet.</p>
                )}
            </dl>
          </div>

          <SocialAccountsPanel
            brandId={brand.id}
            initialAccounts={accounts}
            canEdit={userCanEdit}
          />

          {socialPlatforms.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
              <h2 className="font-display text-base text-ink">Platforms</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {socialPlatforms.map((p) => (
                  <span
                    key={p}
                    className="rounded-full bg-indigo-light px-2.5 py-1 text-xs font-medium text-indigo"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {requiredHashtags.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
              <h2 className="font-display text-base text-ink">Required hashtags</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {requiredHashtags.map((h) => (
                  <span
                    key={h}
                    className="rounded-full bg-canvas px-2.5 py-1 text-xs text-ink"
                  >
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
