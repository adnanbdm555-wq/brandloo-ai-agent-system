"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Sparkles, RefreshCw, ArrowUpRight, Hash, LayoutTemplate } from "lucide-react";
import type { Brand, Campaign, ContentItem, ContentTemplate } from "@/db/schema";

const PLATFORMS = ["Instagram", "Facebook", "LinkedIn", "YouTube", "TikTok", "X"];
const CONTENT_TYPES = ["POST", "REEL", "STORY", "CAROUSEL", "VIDEO", "ARTICLE"];

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-indigo focus:outline-none focus:ring-1 focus:ring-indigo";

function parseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function ContentStudio({
  brands,
  campaigns,
  defaultBrandId,
  defaultCampaignId,
}: {
  brands: Brand[];
  campaigns: Campaign[];
  defaultBrandId?: string;
  defaultCampaignId?: string;
}) {
  const [brandId, setBrandId] = useState(defaultBrandId ?? brands[0]?.id ?? "");
  const [campaignId, setCampaignId] = useState(defaultCampaignId ?? "");
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [brief, setBrief] = useState("");
  const [templates, setTemplates] = useState<ContentTemplate[]>([]);
  const [templateId, setTemplateId] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [results, setResults] = useState<ContentItem[]>([]);

  const brandCampaigns = useMemo(
    () => campaigns.filter((c) => c.brandId === brandId),
    [campaigns, brandId]
  );

  useEffect(() => {
    if (!brandId) return;
    fetch(`/api/templates?brandId=${brandId}`)
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates ?? []))
      .catch(() => {});
  }, [brandId]);

  function applyTemplate(id: string) {
    setTemplateId(id);
    const t = templates.find((x) => x.id === id);
    if (t) {
      setBrief(t.briefTemplate);
      if (t.defaultPlatform) setPlatform(t.defaultPlatform);
      setContentType(t.defaultContentType);
    }
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotConfigured(false);

    if (!brandId) {
      setError("Add a brand first.");
      return;
    }
    if (!brief.trim()) {
      setError("Give the agent a brief to work from.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/content/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId, campaignId, platform, contentType, brief }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (res.status === 503) {
        setNotConfigured(true);
      } else {
        setError(data.error ?? "Something went wrong.");
      }
      return;
    }

    setResults((prev) => [data.content, ...prev]);
    setBrief("");
  }

  if (brands.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
        <p className="text-sm font-medium text-ink">Add a brand first</p>
        <p className="mt-1 text-sm text-muted">
          The Content Agent writes from a brand's knowledge base — add one to get started.
        </p>
        <Link
          href="/brands/new"
          className="mt-4 inline-block rounded-lg bg-indigo px-4 py-2 text-sm font-medium text-white hover:bg-indigo-dark"
        >
          Add a brand
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <form
        onSubmit={handleGenerate}
        className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-card lg:col-span-2 lg:self-start"
      >
        <div>
          <label className="block text-sm font-medium text-ink">Brand</label>
          <select
            value={brandId}
            onChange={(e) => {
              setBrandId(e.target.value);
              setCampaignId("");
            }}
            className={`${inputClass} mt-1.5`}
          >
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">
            Campaign <span className="font-normal text-muted">(optional)</span>
          </label>
          <select
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className={`${inputClass} mt-1.5`}
          >
            <option value="">No campaign</option>
            {brandCampaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-ink">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className={`${inputClass} mt-1.5`}
            >
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Type</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className={`${inputClass} mt-1.5`}
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {templates.length > 0 && (
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium text-ink">
              <LayoutTemplate className="h-3.5 w-3.5 text-muted" />
              Start from a template <span className="font-normal text-muted">(optional)</span>
            </label>
            <select
              value={templateId}
              onChange={(e) => applyTemplate(e.target.value)}
              className={`${inputClass} mt-1.5`}
            >
              <option value="">Blank</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category})
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-ink">Brief</label>
          <textarea
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
            rows={4}
            className={`${inputClass} mt-1.5`}
            placeholder="What should this post be about?"
          />
        </div>

        {notConfigured && (
          <div className="rounded-lg bg-amber-light px-4 py-3 text-sm text-ink/80">
            The Content Agent needs an <code className="rounded bg-ink/5 px-1">ANTHROPIC_API_KEY</code> configured
            on the server to run.
          </div>
        )}
        {error && (
          <p className="rounded-lg bg-danger-light px-4 py-2.5 text-sm text-danger">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-dark disabled:opacity-60"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {loading ? "Writing…" : "Generate"}
        </button>
      </form>

      <div className="space-y-4 lg:col-span-3">
        {results.length === 0 ? (
          <div className="flex h-full min-h-[16rem] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-8 text-center">
            <Sparkles className="h-5 w-5 text-muted" />
            <p className="mt-3 text-sm font-medium text-ink">Nothing generated yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              Fill in the brief and generate — drafts save automatically and
              show up on the Content Calendar.
            </p>
          </div>
        ) : (
          results.map((item) => {
            const hashtags = parseArray(item.hashtags);
            return (
              <div
                key={item.id}
                className="rounded-xl border border-border bg-surface p-6 shadow-card"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{item.title}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {item.platform} · {item.contentType} · Draft
                    </p>
                  </div>
                  <Link
                    href={`/content-calendar?highlight=${item.id}`}
                    className="flex shrink-0 items-center gap-1 text-xs font-medium text-indigo hover:text-indigo-dark"
                  >
                    View in calendar
                    <ArrowUpRight className="h-3 w-3" />
                  </Link>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-ink/80">{item.body}</p>
                {hashtags.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-muted" />
                    {hashtags.map((h) => (
                      <span key={h} className="text-xs text-indigo">
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
