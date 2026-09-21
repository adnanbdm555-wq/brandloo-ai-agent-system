"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  RefreshCw,
  Check,
  X,
  Minus,
  Workflow,
  ArrowUpRight,
  LayoutTemplate,
} from "lucide-react";
import type { Brand, Campaign, ContentTemplate, PipelineRun } from "@/db/schema";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-indigo focus:outline-none focus:ring-1 focus:ring-indigo";

const PLATFORMS = ["Instagram", "Facebook", "LinkedIn", "YouTube", "TikTok", "X"];
const CONTENT_TYPES = ["POST", "REEL", "STORY", "CAROUSEL", "VIDEO", "ARTICLE"];
const VIDEO_TYPES = new Set(["REEL", "VIDEO"]);

type Step = {
  step: "strategy" | "content" | "creative" | "video" | "qa" | "submit";
  status: "success" | "failed" | "skipped";
  detail?: string;
  error?: string;
};

const STEP_LABELS: Record<Step["step"], string> = {
  strategy: "Strategy",
  content: "Content",
  creative: "Creative",
  video: "Video",
  qa: "QA",
  submit: "Submit",
};

function StepRow({ step }: { step: Step }) {
  const icon =
    step.status === "success" ? (
      <Check className="h-3.5 w-3.5 text-white" />
    ) : step.status === "failed" ? (
      <X className="h-3.5 w-3.5 text-white" />
    ) : (
      <Minus className="h-3.5 w-3.5 text-muted" />
    );
  const dotClass =
    step.status === "success"
      ? "bg-success"
      : step.status === "failed"
        ? "bg-danger"
        : "bg-canvas border border-border";

  return (
    <div className="flex items-start gap-3 py-2">
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${dotClass}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink">{STEP_LABELS[step.step]}</p>
        {step.detail && <p className="truncate text-xs text-muted">{step.detail}</p>}
        {step.error && <p className="text-xs text-danger">{step.error}</p>}
      </div>
    </div>
  );
}

function RunResult({ result }: { result: { status: string; steps: Step[]; contentItemId: string | null } }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-ink">Pipeline result</p>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            result.status === "COMPLETED" ? "bg-success-light text-success" : "bg-danger-light text-danger"
          }`}
        >
          {result.status}
        </span>
      </div>
      <div className="mt-2 divide-y divide-border">
        {result.steps.map((s, i) => (
          <StepRow key={i} step={s} />
        ))}
      </div>
      {result.contentItemId && (
        <Link
          href={`/content-calendar?highlight=${result.contentItemId}`}
          className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo hover:text-indigo-dark"
        >
          View content in calendar
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

export function Pipeline({
  brands,
  campaigns,
  templates,
  defaultBrandId,
  defaultCampaignId,
}: {
  brands: Brand[];
  campaigns: Campaign[];
  templates: ContentTemplate[];
  defaultBrandId?: string;
  defaultCampaignId?: string;
}) {
  const [brandId, setBrandId] = useState(defaultBrandId ?? brands[0]?.id ?? "");
  const [campaignId, setCampaignId] = useState(defaultCampaignId ?? "");
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [brief, setBrief] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [runCreative, setRunCreative] = useState(true);
  const [runVideo, setRunVideo] = useState(true);
  const [runQA, setRunQA] = useState(true);
  const [autoSubmit, setAutoSubmit] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    status: string;
    steps: Step[];
    contentItemId: string | null;
  } | null>(null);
  const [history, setHistory] = useState<PipelineRun[]>([]);

  const brandCampaigns = useMemo(
    () => campaigns.filter((c) => c.brandId === brandId),
    [campaigns, brandId]
  );
  const brandTemplates = useMemo(
    () => templates.filter((t) => !t.brandId || t.brandId === brandId),
    [templates, brandId]
  );
  const videoApplicable = VIDEO_TYPES.has(contentType);

  useEffect(() => {
    if (!brandId) return;
    fetch(`/api/pipeline/runs?brandId=${brandId}`)
      .then((r) => r.json())
      .then((data) => setHistory(data.runs ?? []))
      .catch(() => {});
  }, [brandId, result]);

  function applyTemplate(id: string) {
    setTemplateId(id);
    const t = brandTemplates.find((x) => x.id === id);
    if (t) {
      setBrief(t.briefTemplate);
      if (t.defaultPlatform) setPlatform(t.defaultPlatform);
      setContentType(t.defaultContentType);
    }
  }

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!brandId) {
      setError("Add a brand first.");
      return;
    }
    if (!brief.trim()) {
      setError("Give the pipeline a brief to work from.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/pipeline/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId,
        campaignId,
        platform,
        contentType,
        brief,
        runCreative,
        runVideo: runVideo && videoApplicable,
        runQA,
        autoSubmit,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok && !data.steps) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setResult(data);
  }

  if (brands.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
        <p className="text-sm font-medium text-ink">Add a brand first</p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-5">
      <form
        onSubmit={run}
        className="space-y-4 rounded-xl border border-border bg-surface p-6 shadow-card lg:col-span-2 lg:self-start"
      >
        <div className="flex items-center gap-2 rounded-lg bg-indigo-light px-3.5 py-2.5 text-xs text-indigo">
          <Workflow className="h-3.5 w-3.5 shrink-0" />
          Strategy → Content → Creative → Video → QA, chained in one run.
        </div>

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
            Campaign <span className="font-normal text-muted">(runs Strategy first if it has none yet)</span>
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

        {brandTemplates.length > 0 && (
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
              {brandTemplates.map((t) => (
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
            rows={3}
            className={`${inputClass} mt-1.5`}
            placeholder="What should this post be about?"
          />
        </div>

        <div className="space-y-2 rounded-lg border border-border p-3.5">
          <p className="text-xs font-medium text-muted">Steps to run after Content</p>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={runCreative}
              onChange={(e) => setRunCreative(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Creative brief
          </label>
          <label className={`flex items-center gap-2 text-sm ${videoApplicable ? "text-ink" : "text-muted"}`}>
            <input
              type="checkbox"
              checked={runVideo && videoApplicable}
              disabled={!videoApplicable}
              onChange={(e) => setRunVideo(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Video script {!videoApplicable && "(only for Reel/Video)"}
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={runQA}
              onChange={(e) => setRunQA(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            QA check
          </label>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={autoSubmit}
              onChange={(e) => setAutoSubmit(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Auto-submit for approval if QA passes
          </label>
        </div>

        {error && (
          <p className="rounded-lg bg-danger-light px-4 py-2.5 text-sm text-danger">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-dark disabled:opacity-60"
        >
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Running pipeline…" : "Run pipeline"}
        </button>
        {loading && (
          <p className="text-center text-xs text-muted">
            Running several agents in sequence — this can take up to a minute.
          </p>
        )}
      </form>

      <div className="space-y-4 lg:col-span-3">
        {result ? (
          <RunResult result={result} />
        ) : (
          <div className="flex h-full min-h-[12rem] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface p-8 text-center">
            <Workflow className="h-5 w-5 text-muted" />
            <p className="mt-3 text-sm font-medium text-ink">No run yet</p>
            <p className="mt-1 max-w-xs text-sm text-muted">
              Fill in the brief and run — every step's result shows up here.
            </p>
          </div>
        )}

        {history.length > 0 && (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
            <p className="text-sm font-medium text-ink">Recent runs</p>
            <div className="mt-3 space-y-2">
              {history.map((h) => {
                const stepList: Step[] = JSON.parse(h.steps);
                const succeeded = stepList.filter((s) => s.status === "success").length;
                return (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5 text-xs"
                  >
                    <span className="text-muted">
                      {new Date(h.createdAt).toLocaleString()} · {succeeded}/{stepList.length} steps
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-medium ${
                        h.status === "COMPLETED" ? "bg-success-light text-success" : "bg-danger-light text-danger"
                      }`}
                    >
                      {h.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
