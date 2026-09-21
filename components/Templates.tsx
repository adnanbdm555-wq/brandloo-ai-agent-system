"use client";

import { useState } from "react";
import { Plus, X, Trash2, LayoutTemplate } from "lucide-react";
import type { Brand, ContentTemplate } from "@/db/schema";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus:border-indigo focus:outline-none focus:ring-1 focus:ring-indigo";

export function Templates({
  brands,
  initialTemplates,
  canEdit,
}: {
  brands: Brand[];
  initialTemplates: ContentTemplate[];
  canEdit: boolean;
}) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [briefTemplate, setBriefTemplate] = useState("");
  const [brandId, setBrandId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function brandName(id: string | null) {
    if (!id) return "All brands";
    return brands.find((b) => b.id === id)?.name ?? "";
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !category.trim() || !briefTemplate.trim()) {
      setError("Fill in name, category, and the template text.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category, briefTemplate, brandId }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setTemplates((prev) => [data.template, ...prev]);
    setName("");
    setCategory("");
    setBriefTemplate("");
    setBrandId("");
    setShowForm(false);
  }

  async function remove(id: string) {
    const prev = templates;
    setTemplates((t) => t.filter((x) => x.id !== id));
    const res = await fetch(`/api/templates/${id}`, { method: "DELETE" });
    if (!res.ok) setTemplates(prev);
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
            {showForm ? "Cancel" : "New template"}
          </button>
        </div>
      )}

      {showForm && (
        <form
          onSubmit={create}
          className="mt-4 space-y-3 rounded-xl border border-border bg-surface p-6 shadow-card"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`${inputClass} mt-1.5`}
                placeholder="Product feature highlight"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Category</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${inputClass} mt-1.5`}
                placeholder="Product"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">
              Applies to <span className="font-normal text-muted">(optional)</span>
            </label>
            <select
              value={brandId}
              onChange={(e) => setBrandId(e.target.value)}
              className={`${inputClass} mt-1.5`}
            >
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">
              Brief template
            </label>
            <p className="mt-0.5 text-xs text-muted">
              What gets pre-filled into Content Studio's brief field.
            </p>
            <textarea
              value={briefTemplate}
              onChange={(e) => setBriefTemplate(e.target.value)}
              rows={3}
              className={`${inputClass} mt-1.5`}
              placeholder="Highlight [feature name] and how it solves [customer problem]."
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo px-4 py-2 text-sm font-medium text-white hover:bg-indigo-dark disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save template"}
          </button>
        </form>
      )}

      {templates.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-xl border border-dashed border-border bg-surface py-16 text-center">
          <LayoutTemplate className="h-5 w-5 text-muted" />
          <p className="mt-3 text-sm font-medium text-ink">No templates yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Save a recurring brief once, then reuse it from Content Studio.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {templates.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-surface p-5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-ink">{t.name}</p>
                  <p className="text-xs text-muted">
                    {t.category} · {brandName(t.brandId)}
                  </p>
                </div>
                {canEdit && (
                  <button
                    onClick={() => remove(t.id)}
                    className="shrink-0 rounded p-1 text-muted hover:bg-danger-light hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-ink/70">{t.briefTemplate}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
