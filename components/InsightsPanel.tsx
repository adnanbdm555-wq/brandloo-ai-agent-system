"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, Lightbulb, TrendingUp } from "lucide-react";
import type { Brand, AIInsight } from "@/db/schema";

function parseArray(value: string): string[] {
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function InsightsPanel({ brands }: { brands: Brand[] }) {
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);
  const [insufficientData, setInsufficientData] = useState<string | null>(null);

  useEffect(() => {
    if (!brandId) return;
    setLoaded(false);
    fetch(`/api/brands/${brandId}/insights`)
      .then((r) => r.json())
      .then((data) => {
        setInsight(data.insight);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, [brandId]);

  async function generate() {
    setLoading(true);
    setError(null);
    setNotConfigured(false);
    setInsufficientData(null);

    const res = await fetch(`/api/brands/${brandId}/insights`, { method: "POST" });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (res.status === 503) setNotConfigured(true);
      else if (res.status === 422) setInsufficientData(data.error);
      else setError(data.error ?? "Something went wrong.");
      return;
    }

    setInsight(data.insight);
  }

  if (brands.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
        <p className="text-sm font-medium text-ink">No brands yet</p>
      </div>
    );
  }

  const observations = insight ? parseArray(insight.observations) : [];
  const recommendations = insight ? parseArray(insight.recommendations) : [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <select
          value={brandId}
          onChange={(e) => setBrandId(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
        >
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-indigo px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-dark disabled:opacity-60"
        >
          {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? "Analyzing…" : insight ? "Refresh insights" : "Generate insights"}
        </button>
      </div>

      {notConfigured && (
        <div className="mt-4 rounded-lg bg-amber-light px-4 py-3 text-sm text-ink/80">
          The Insights Agent needs an <code className="rounded bg-ink/5 px-1">ANTHROPIC_API_KEY</code> configured
          on the server to run.
        </div>
      )}
      {insufficientData && (
        <div className="mt-4 rounded-lg bg-amber-light px-4 py-3 text-sm text-ink/80">
          {insufficientData} Add metrics to more published posts on the
          Analytics page first.
        </div>
      )}
      {error && (
        <p className="mt-4 rounded-lg bg-danger-light px-4 py-2.5 text-sm text-danger">{error}</p>
      )}

      {!loaded ? null : !insight && !insufficientData && !notConfigured ? (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-border bg-surface py-16 text-center">
          <Lightbulb className="h-5 w-5 text-muted" />
          <p className="mt-3 text-sm font-medium text-ink">No insights yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Publish a few posts, log their real metrics on the Analytics
            page, then generate insights here.
          </p>
        </div>
      ) : insight ? (
        <div className="mt-6 space-y-5">
          <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                <TrendingUp className="h-4 w-4 text-indigo" />
                Summary
              </p>
              <span className="text-xs text-muted">
                Based on {insight.dataPointsUsed} posts
              </span>
            </div>
            <p className="mt-2 text-sm text-ink/80">{insight.summary}</p>
          </div>

          {observations.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
              <p className="text-sm font-medium text-ink">What's working</p>
              <ul className="mt-3 space-y-2">
                {observations.map((o, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink/80">
                    <span className="text-indigo">•</span>
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.length > 0 && (
            <div className="rounded-xl border border-amber/30 bg-amber-light p-6">
              <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                <Sparkles className="h-4 w-4 text-amber-dark" />
                Recommendations
              </p>
              <ul className="mt-3 space-y-2">
                {recommendations.map((r, i) => (
                  <li key={i} className="flex gap-2 text-sm text-ink/80">
                    <span className="text-amber-dark">•</span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
