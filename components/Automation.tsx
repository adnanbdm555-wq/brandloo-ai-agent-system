"use client";

import { useState, useMemo } from "react";
import { Plus, X, Trash2, Play, Workflow } from "lucide-react";
import type { Brand, Campaign, ContentTemplate, AutomationRule } from "@/db/schema";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-indigo focus:outline-none focus:ring-1 focus:ring-indigo";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PLATFORMS = ["Instagram", "Facebook", "LinkedIn", "YouTube", "TikTok", "X"];

function scheduleLabel(rule: AutomationRule): string {
  const day = rule.scheduleDayOfWeek === null ? "Every day" : DAYS[rule.scheduleDayOfWeek];
  return `${day} at ${String(rule.scheduleHourUtc).padStart(2, "0")}:00 UTC`;
}

export function Automation({
  brands,
  campaigns,
  templates,
  initialRules,
  canEdit,
}: {
  brands: Brand[];
  campaigns: Campaign[];
  templates: ContentTemplate[];
  initialRules: AutomationRule[];
  canEdit: boolean;
}) {
  const [rules, setRules] = useState(initialRules);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState(brands[0]?.id ?? "");
  const [campaignId, setCampaignId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [briefOverride, setBriefOverride] = useState("");
  const [platform, setPlatform] = useState(PLATFORMS[0]);
  const [dayOfWeek, setDayOfWeek] = useState<string>("");
  const [hourUtc, setHourUtc] = useState("9");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runMessage, setRunMessage] = useState<string | null>(null);

  const brandCampaigns = useMemo(
    () => campaigns.filter((c) => c.brandId === brandId),
    [campaigns, brandId]
  );
  const brandTemplates = useMemo(
    () => templates.filter((t) => !t.brandId || t.brandId === brandId),
    [templates, brandId]
  );

  function brandName(id: string) {
    return brands.find((b) => b.id === id)?.name ?? "";
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError("Give this automation a name.");
      return;
    }
    if (!templateId && !briefOverride.trim()) {
      setError("Pick a template or write a brief.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/automation-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        brandId,
        campaignId,
        templateId,
        briefOverride,
        platform,
        scheduleDayOfWeek: dayOfWeek === "" ? null : parseInt(dayOfWeek, 10),
        scheduleHourUtc: parseInt(hourUtc, 10),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setRules((prev) => [data.rule, ...prev]);
    setName("");
    setBriefOverride("");
    setTemplateId("");
    setShowForm(false);
  }

  async function toggleEnabled(rule: AutomationRule) {
    const res = await fetch(`/api/automation-rules/${rule.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !rule.enabled }),
    });
    const data = await res.json();
    if (res.ok) {
      setRules((prev) => prev.map((r) => (r.id === rule.id ? data.rule : r)));
    }
  }

  async function remove(id: string) {
    if (!confirm("Delete this automation?")) return;
    const prev = rules;
    setRules((r) => r.filter((x) => x.id !== id));
    const res = await fetch(`/api/automation-rules/${id}`, { method: "DELETE" });
    if (!res.ok) setRules(prev);
  }

  async function runNow(id: string) {
    setRunningId(id);
    setRunMessage(null);
    const res = await fetch(`/api/automation-rules/${id}/run-now`, { method: "POST" });
    const data = await res.json();
    setRunningId(null);
    if (!res.ok) {
      setRunMessage(data.error ?? "Run failed.");
      return;
    }
    setRunMessage(`Generated "${data.content.title}" — see it in Content Studio.`);
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, lastRunAt: new Date() } : r))
    );
  }

  if (brands.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
        <p className="text-sm font-medium text-ink">Add a brand first</p>
      </div>
    );
  }

  return (
    <div>
      {canEdit && (
        <div className="flex justify-end">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-dark"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "New automation"}
          </button>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={create}
          className="mt-4 space-y-3 rounded-xl border border-border bg-surface p-6 shadow-card"
        >
          <div>
            <label className="block text-sm font-medium text-ink">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClass} mt-1.5`}
              placeholder="Weekly product highlight"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink">Brand</label>
              <select
                value={brandId}
                onChange={(e) => {
                  setBrandId(e.target.value);
                  setCampaignId("");
                  setTemplateId("");
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
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">
              Template <span className="font-normal text-muted">(or write a brief below)</span>
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className={`${inputClass} mt-1.5`}
            >
              <option value="">No template</option>
              {brandTemplates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {!templateId && (
            <div>
              <label className="block text-sm font-medium text-ink">Brief</label>
              <textarea
                value={briefOverride}
                onChange={(e) => setBriefOverride(e.target.value)}
                rows={2}
                className={`${inputClass} mt-1.5`}
                placeholder="What should each generated post be about?"
              />
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
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
              <label className="block text-sm font-medium text-ink">Day</label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value)}
                className={`${inputClass} mt-1.5`}
              >
                <option value="">Every day</option>
                {DAYS.map((d, i) => (
                  <option key={d} value={i}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Hour (UTC)</label>
              <input
                type="number"
                min={0}
                max={23}
                value={hourUtc}
                onChange={(e) => setHourUtc(e.target.value)}
                className={`${inputClass} mt-1.5`}
              />
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo px-4 py-2 text-sm font-medium text-white hover:bg-indigo-dark disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save automation"}
          </button>
        </form>
      )}

      {runMessage && (
        <p className="mt-4 rounded-lg bg-indigo-light px-4 py-2.5 text-sm text-indigo">
          {runMessage}
        </p>
      )}

      {rules.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-border bg-surface py-16 text-center">
          <Workflow className="h-5 w-5 text-muted" />
          <p className="mt-3 text-sm font-medium text-ink">No automations yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Set one up to have the Content Agent draft posts on a schedule.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="rounded-xl border border-border bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">{rule.name}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.63rem] font-medium ${
                        rule.enabled ? "bg-success-light text-success" : "bg-canvas text-muted"
                      }`}
                    >
                      {rule.enabled ? "Enabled" : "Paused"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    {brandName(rule.brandId)} · {rule.platform} · {scheduleLabel(rule)}
                  </p>
                  {rule.lastRunAt && (
                    <p className="mt-1 text-xs text-muted">
                      Last ran {new Date(rule.lastRunAt).toLocaleString()}
                    </p>
                  )}
                </div>
                {canEdit && (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <button
                      onClick={() => runNow(rule.id)}
                      disabled={runningId === rule.id}
                      className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-canvas disabled:opacity-60"
                    >
                      <Play className="h-3 w-3" />
                      {runningId === rule.id ? "Running…" : "Run now"}
                    </button>
                    <button
                      onClick={() => toggleEnabled(rule)}
                      className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-canvas"
                    >
                      {rule.enabled ? "Pause" : "Enable"}
                    </button>
                    <button
                      onClick={() => remove(rule.id)}
                      className="rounded p-1.5 text-muted hover:bg-danger-light hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
