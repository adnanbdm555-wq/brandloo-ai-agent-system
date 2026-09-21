"use client";

import { useState, useEffect, useMemo } from "react";
import { Sparkles, RefreshCw, Image as ImageIcon, Palette } from "lucide-react";
import type { Brand, ContentItem, CreativeAsset } from "@/db/schema";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-indigo focus:outline-none focus:ring-1 focus:ring-indigo";

export function CreativeStudio({
  brands,
  contentItems,
  defaultContentId,
}: {
  brands: Brand[];
  contentItems: ContentItem[];
  defaultContentId?: string;
}) {
  const [contentId, setContentId] = useState(defaultContentId ?? contentItems[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [assets, setAssets] = useState<CreativeAsset[]>([]);
  const [imageUrlDrafts, setImageUrlDrafts] = useState<Record<string, string>>({});

  const selectedItem = useMemo(
    () => contentItems.find((c) => c.id === contentId),
    [contentItems, contentId]
  );

  function brandName(id: string) {
    return brands.find((b) => b.id === id)?.name ?? "";
  }

  useEffect(() => {
    if (!contentId) return;
    fetch(`/api/content/${contentId}/creative`)
      .then((r) => r.json())
      .then((data) => setAssets(data.assets ?? []))
      .catch(() => {});
  }, [contentId]);

  async function generate() {
    if (!contentId) return;
    setLoading(true);
    setError(null);
    setNotConfigured(false);

    const res = await fetch(`/api/content/${contentId}/creative`, { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (res.status === 503) setNotConfigured(true);
      else setError(data.error ?? "Something went wrong.");
      return;
    }

    setAssets((prev) => [data.asset, ...prev]);
  }

  async function attachImage(assetId: string) {
    const url = imageUrlDrafts[assetId];
    if (!url?.trim()) return;
    const res = await fetch(`/api/creative-assets/${assetId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: url }),
    });
    const data = await res.json();
    if (res.ok) {
      setAssets((prev) => prev.map((a) => (a.id === assetId ? data.asset : a)));
    }
  }

  if (contentItems.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
        <p className="text-sm font-medium text-ink">No content yet</p>
        <p className="mt-1 text-sm text-muted">
          Generate a post in Content Studio first — the Creative Agent writes
          a brief for a specific post.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2 lg:self-start">
        <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
          <label className="block text-sm font-medium text-ink">Content</label>
          <select
            value={contentId}
            onChange={(e) => setContentId(e.target.value)}
            className={`${inputClass} mt-1.5`}
          >
            {contentItems.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} — {brandName(c.brandId)}
              </option>
            ))}
          </select>

          {selectedItem && (
            <div className="mt-4 rounded-lg bg-canvas p-3.5 text-xs text-ink/70">
              {selectedItem.body}
            </div>
          )}

          {notConfigured && (
            <div className="mt-4 rounded-lg bg-amber-light px-4 py-3 text-sm text-ink/80">
              The Creative Agent needs an <code className="rounded bg-ink/5 px-1">ANTHROPIC_API_KEY</code> configured
              on the server to run.
            </div>
          )}
          {error && (
            <p className="mt-4 rounded-lg bg-danger-light px-4 py-2.5 text-sm text-danger">{error}</p>
          )}

          <button
            onClick={generate}
            disabled={loading || !contentId}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-dark disabled:opacity-60"
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? "Writing…" : "Generate creative brief"}
          </button>
        </div>
      </div>

      <div className="space-y-4 lg:col-span-3">
        {assets.length === 0 ? (
          <div className="flex h-full min-h-[16rem] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-8 text-center">
            <Palette className="h-5 w-5 text-muted" />
            <p className="mt-3 text-sm font-medium text-ink">No briefs yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              Generate a brief, then hand it to a designer or paste in an
              image URL once one exists.
            </p>
          </div>
        ) : (
          assets.map((asset) => (
            <div key={asset.id} className="rounded-xl border border-border bg-surface p-6 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-ink">Creative brief</p>
                {asset.suggestedAspectRatio && (
                  <span className="rounded border border-border px-1.5 py-0.5 text-[0.68rem] text-muted">
                    {asset.suggestedAspectRatio}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-ink/80">{asset.briefText}</p>
              {asset.visualDirection && (
                <p className="mt-2 text-xs text-muted">
                  <span className="font-medium text-ink/60">Direction: </span>
                  {asset.visualDirection}
                </p>
              )}

              <div className="mt-4 border-t border-border pt-4">
                {asset.imageUrl ? (
                  <div className="flex items-center gap-2 text-xs text-success">
                    <ImageIcon className="h-3.5 w-3.5" />
                    Image attached
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={imageUrlDrafts[asset.id] ?? ""}
                      onChange={(e) =>
                        setImageUrlDrafts((prev) => ({ ...prev, [asset.id]: e.target.value }))
                      }
                      placeholder="Paste an image URL once one's ready"
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      onClick={() => attachImage(asset.id)}
                      className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink hover:bg-canvas"
                    >
                      Attach
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
