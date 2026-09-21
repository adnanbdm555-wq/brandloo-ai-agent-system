"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Pencil, Check, X, TrendingUp } from "lucide-react";
import type { Brand, ContentItem } from "@/db/schema";

const inputClass =
  "w-20 rounded border border-border bg-surface px-2 py-1 text-xs text-ink focus:border-indigo focus:outline-none focus:ring-1 focus:ring-indigo";

type MetricKey = "reach" | "impressions" | "likes" | "comments" | "shares" | "linkClicks";

function MetricsRow({
  item,
  onUpdated,
}: {
  item: ContentItem;
  onUpdated: (item: ContentItem) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<MetricKey, string>>({
    reach: item.reach?.toString() ?? "",
    impressions: item.impressions?.toString() ?? "",
    likes: item.likes?.toString() ?? "",
    comments: item.comments?.toString() ?? "",
    shares: item.shares?.toString() ?? "",
    linkClicks: item.linkClicks?.toString() ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const payload: Record<string, number | null> = {};
    (Object.keys(values) as MetricKey[]).forEach((k) => {
      payload[k] = values[k] === "" ? null : parseInt(values[k], 10);
    });
    const res = await fetch(`/api/content/${item.id}/metrics`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      onUpdated(data.content);
      setEditing(false);
    }
  }

  const hasAnyMetric =
    item.reach != null ||
    item.impressions != null ||
    item.likes != null ||
    item.comments != null ||
    item.shares != null ||
    item.linkClicks != null;

  if (editing) {
    return (
      <tr className="border-b border-border">
        <td className="py-2.5 pr-3 text-sm text-ink">{item.title}</td>
        {(["reach", "impressions", "likes", "comments", "shares", "linkClicks"] as MetricKey[]).map((k) => (
          <td key={k} className="py-2.5 pr-3">
            <input
              value={values[k]}
              onChange={(e) => setValues((v) => ({ ...v, [k]: e.target.value.replace(/\D/g, "") }))}
              className={inputClass}
              placeholder="—"
            />
          </td>
        ))}
        <td className="py-2.5">
          <div className="flex gap-1">
            <button onClick={save} disabled={saving} className="rounded p-1 text-success hover:bg-success-light">
              <Check className="h-4 w-4" />
            </button>
            <button onClick={() => setEditing(false)} className="rounded p-1 text-muted hover:bg-canvas">
              <X className="h-4 w-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-border">
      <td className="py-2.5 pr-3 text-sm text-ink">
        {item.title}
        {!hasAnyMetric && (
          <span className="ml-2 rounded bg-amber-light px-1.5 py-0.5 text-[0.63rem] text-amber-dark">
            no data
          </span>
        )}
      </td>
      <td className="py-2.5 pr-3 text-sm text-ink/70">{item.reach ?? "—"}</td>
      <td className="py-2.5 pr-3 text-sm text-ink/70">{item.impressions ?? "—"}</td>
      <td className="py-2.5 pr-3 text-sm text-ink/70">{item.likes ?? "—"}</td>
      <td className="py-2.5 pr-3 text-sm text-ink/70">{item.comments ?? "—"}</td>
      <td className="py-2.5 pr-3 text-sm text-ink/70">{item.shares ?? "—"}</td>
      <td className="py-2.5 pr-3 text-sm text-ink/70">{item.linkClicks ?? "—"}</td>
      <td className="py-2.5">
        <button onClick={() => setEditing(true)} className="rounded p-1 text-muted hover:bg-canvas hover:text-ink">
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

export function Analytics({
  brands,
  initialPublished,
}: {
  brands: Brand[];
  initialPublished: ContentItem[];
}) {
  const [items, setItems] = useState(initialPublished);
  const [brandFilter, setBrandFilter] = useState<string>("all");

  const filtered = useMemo(
    () => (brandFilter === "all" ? items : items.filter((i) => i.brandId === brandFilter)),
    [items, brandFilter]
  );

  const totals = useMemo(() => {
    const sum = (key: MetricKey) =>
      filtered.reduce((acc, i) => acc + (i[key] ?? 0), 0);
    return {
      reach: sum("reach"),
      engagement: sum("likes") + sum("comments") + sum("shares"),
      linkClicks: sum("linkClicks"),
      withData: filtered.filter((i) => i.reach != null || i.likes != null).length,
    };
  }, [filtered]);

  const chartData = useMemo(
    () =>
      filtered
        .filter((i) => i.reach != null)
        .slice(0, 8)
        .map((i) => ({
          name: i.title.length > 18 ? i.title.slice(0, 18) + "…" : i.title,
          reach: i.reach ?? 0,
        })),
    [filtered]
  );

  function handleUpdated(updated: ContentItem) {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border bg-surface px-5 py-4 shadow-card">
            <p className="text-xs font-medium text-muted">Total Reach</p>
            <p className="mt-1.5 font-display text-2xl text-ink">{totals.reach.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-5 py-4 shadow-card">
            <p className="text-xs font-medium text-muted">Engagement</p>
            <p className="mt-1.5 font-display text-2xl text-ink">{totals.engagement.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-5 py-4 shadow-card">
            <p className="text-xs font-medium text-muted">Link Clicks</p>
            <p className="mt-1.5 font-display text-2xl text-ink">{totals.linkClicks.toLocaleString()}</p>
          </div>
          <div className="rounded-xl border border-border bg-surface px-5 py-4 shadow-card">
            <p className="text-xs font-medium text-muted">Posts with data</p>
            <p className="mt-1.5 font-display text-2xl text-ink">
              {totals.withData}/{filtered.length}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <select
          value={brandFilter}
          onChange={(e) => setBrandFilter(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
        >
          <option value="all">All brands</option>
          {brands.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {chartData.length > 0 && (
        <div className="mt-5 rounded-xl border border-border bg-surface p-6 shadow-card">
          <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <TrendingUp className="h-4 w-4 text-indigo" />
            Reach by post
          </p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E3DC" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#8A8778" }} />
                <YAxis tick={{ fontSize: 11, fill: "#8A8778" }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #E6E3DC", fontSize: 12 }}
                />
                <Bar dataKey="reach" fill="#3552E0" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-border bg-surface p-6 shadow-card">
        <p className="text-sm font-medium text-ink">Published posts</p>
        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nothing published yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-xs font-medium text-muted">
                  <th className="pb-2 pr-3">Post</th>
                  <th className="pb-2 pr-3">Reach</th>
                  <th className="pb-2 pr-3">Impr.</th>
                  <th className="pb-2 pr-3">Likes</th>
                  <th className="pb-2 pr-3">Comments</th>
                  <th className="pb-2 pr-3">Shares</th>
                  <th className="pb-2 pr-3">Clicks</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <MetricsRow key={item.id} item={item} onUpdated={handleUpdated} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
