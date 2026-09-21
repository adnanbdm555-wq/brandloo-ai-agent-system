"use client";

import { useState } from "react";
import { ExternalLink, Send, CheckCircle2 } from "lucide-react";
import type { Brand, ContentItem, SocialAccount } from "@/db/schema";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-indigo focus:outline-none focus:ring-1 focus:ring-indigo";

function MarkPublishedForm({
  item,
  accounts,
  onPublished,
}: {
  item: ContentItem;
  accounts: SocialAccount[];
  onPublished: (item: ContentItem) => void;
}) {
  const [url, setUrl] = useState("");
  const [accountId, setAccountId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const brandAccounts = accounts.filter(
    (a) => a.brandId === item.brandId && a.platform === item.platform?.toUpperCase()
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!url.trim()) {
      setError("Paste the live post URL.");
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/content/${item.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publishedUrl: url, socialAccountId: accountId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    onPublished(data.content);
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-wrap items-center gap-2">
      {brandAccounts.length > 0 && (
        <select
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          className={`${inputClass} w-auto min-w-[9rem]`}
        >
          <option value="">Which account?</option>
          {brandAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.accountName}
            </option>
          ))}
        </select>
      )}
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Live post URL"
        className={`${inputClass} flex-1 min-w-[12rem]`}
      />
      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-1.5 rounded-lg bg-indigo px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-dark disabled:opacity-60"
      >
        <Send className="h-3.5 w-3.5" />
        {loading ? "Saving…" : "Mark published"}
      </button>
      {error && <p className="w-full text-xs text-danger">{error}</p>}
    </form>
  );
}

export function PublishingCenter({
  brands,
  accounts,
  initialReady,
  initialPublished,
}: {
  brands: Brand[];
  accounts: SocialAccount[];
  initialReady: ContentItem[];
  initialPublished: ContentItem[];
}) {
  const [ready, setReady] = useState(initialReady);
  const [published, setPublished] = useState(initialPublished);

  function brandName(id: string) {
    return brands.find((b) => b.id === id)?.name ?? "";
  }

  function handlePublished(item: ContentItem) {
    setReady((prev) => prev.filter((i) => i.id !== item.id));
    setPublished((prev) => [item, ...prev]);
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-lg text-ink">
          Ready to publish ({ready.length})
        </h2>
        <p className="mt-1 text-sm text-muted">
          Approved content. Post it through the platform's own app, then
          confirm the live link here.
        </p>
        {ready.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-surface py-10 text-center text-sm text-muted">
            Nothing approved and waiting yet.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {ready.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-surface p-5 shadow-card">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{item.title}</p>
                  <span className="rounded border border-border px-1.5 py-0.5 text-[0.63rem] text-muted">
                    {item.platform}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">{brandName(item.brandId)}</p>
                <p className="mt-2 line-clamp-2 text-sm text-ink/70">{item.body}</p>
                <MarkPublishedForm item={item} accounts={accounts} onPublished={handlePublished} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="font-display text-lg text-ink">
          Published ({published.length})
        </h2>
        {published.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border bg-surface py-10 text-center text-sm text-muted">
            Nothing published yet.
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {published.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <div>
                    <p className="text-sm font-medium text-ink">{item.title}</p>
                    <p className="text-xs text-muted">
                      {brandName(item.brandId)} ·{" "}
                      {item.publishedAt && new Date(item.publishedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {item.publishedUrl && (
                  <a
                    href={item.publishedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-indigo hover:text-indigo-dark"
                  >
                    View live
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
