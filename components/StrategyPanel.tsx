"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, RefreshCw } from "lucide-react";
import type { Campaign } from "@/db/schema";

function parseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function StrategyPanel({
  campaign,
  canEdit,
}: {
  campaign: Campaign;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  const pillars = parseArray(campaign.contentPillars);
  const hasStrategy = !!campaign.strategyGeneratedAt;

  async function generate() {
    setLoading(true);
    setError(null);
    setNotConfigured(false);

    const res = await fetch(`/api/campaigns/${campaign.id}/strategy`, {
      method: "POST",
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

    router.refresh();
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg text-ink">
            <Sparkles className="h-4 w-4 text-amber" />
            Strategy
          </h2>
          <p className="mt-1 text-sm text-muted">
            Content pillars and key messages, generated from this brand's
            knowledge base and the campaign objective.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={generate}
            disabled={loading}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-indigo px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-dark disabled:opacity-60"
          >
            {loading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {loading
              ? "Generating…"
              : hasStrategy
                ? "Regenerate"
                : "Generate strategy"}
          </button>
        )}
      </div>

      {notConfigured && (
        <div className="mt-4 rounded-lg bg-amber-light px-4 py-3 text-sm text-ink/80">
          The Strategy Agent needs an <code className="rounded bg-ink/5 px-1">ANTHROPIC_API_KEY</code> configured
          on the server to run. Add one to your environment and try again.
        </div>
      )}
      {error && (
        <p className="mt-4 rounded-lg bg-danger-light px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      {hasStrategy ? (
        <div className="mt-5 space-y-4">
          {pillars.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted">Content pillars</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {pillars.map((p) => (
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
          {campaign.keyMessages && (
            <div>
              <p className="text-xs font-medium text-muted">Key messages</p>
              <p className="mt-1 text-sm text-ink/80">{campaign.keyMessages}</p>
            </div>
          )}
          {campaign.strategyNotes && (
            <div>
              <p className="text-xs font-medium text-muted">Notes</p>
              <p className="mt-1 text-sm text-ink/80">{campaign.strategyNotes}</p>
            </div>
          )}
        </div>
      ) : (
        !notConfigured && (
          <div className="mt-5 flex flex-col items-center rounded-lg border border-dashed border-border py-8 text-center">
            <p className="text-sm text-muted">
              No strategy generated yet for this campaign.
            </p>
          </div>
        )
      )}
    </div>
  );
}
