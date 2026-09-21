"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Brand } from "@/db/schema";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-indigo focus:outline-none focus:ring-1 focus:ring-indigo";

export function CampaignForm({
  brands,
  defaultBrandId,
}: {
  brands: Brand[];
  defaultBrandId?: string;
}) {
  const router = useRouter();
  const [brandId, setBrandId] = useState(defaultBrandId ?? brands[0]?.id ?? "");
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [platforms, setPlatforms] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!brandId) {
      setError("Add a brand first — campaigns belong to a brand.");
      return;
    }
    if (!name.trim()) {
      setError("Campaign name is required.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandId,
        name,
        objective,
        startDate,
        endDate,
        targetPlatforms: platforms
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean),
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    router.push(`/campaigns/${data.campaign.id}`);
    router.refresh();
  }

  if (brands.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
        <p className="text-sm font-medium text-ink">Add a brand first</p>
        <p className="mt-1 text-sm text-muted">
          Campaigns belong to a brand — create one before starting a campaign.
        </p>
        <a
          href="/brands/new"
          className="mt-4 inline-block rounded-lg bg-indigo px-4 py-2 text-sm font-medium text-white hover:bg-indigo-dark"
        >
          Add a brand
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink">Brand</label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className={`${inputClass} mt-1.5`}
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink">Campaign name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClass} mt-1.5`}
              placeholder="e.g. Eid Collection Launch"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink">Objective</label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={2}
              className={`${inputClass} mt-1.5`}
              placeholder="What should this campaign achieve? The Strategy Agent uses this."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`${inputClass} mt-1.5`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">End date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`${inputClass} mt-1.5`}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-ink">
              Target platforms
            </label>
            <p className="mt-0.5 text-xs text-muted">Comma separated</p>
            <input
              value={platforms}
              onChange={(e) => setPlatforms(e.target.value)}
              className={`${inputClass} mt-1.5`}
              placeholder="Instagram, Facebook"
            />
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-danger-light px-4 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-indigo px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-dark disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create campaign"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-muted hover:bg-canvas"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
