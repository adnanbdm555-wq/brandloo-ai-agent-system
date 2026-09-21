"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, FileText } from "lucide-react";
import type { BrandKnowledgeEntry } from "@/db/schema";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "COMPANY_INFORMATION", label: "Company Information" },
  { value: "PRODUCTS", label: "Products" },
  { value: "SERVICES", label: "Services" },
  { value: "FAQS", label: "FAQs" },
  { value: "USPS", label: "USPs" },
  { value: "TARGET_AUDIENCE", label: "Target Audience" },
  { value: "CUSTOMER_PAIN_POINTS", label: "Customer Pain Points" },
  { value: "CUSTOMER_BENEFITS", label: "Customer Benefits" },
  { value: "COMPETITORS", label: "Competitors" },
  { value: "BRAND_VOICE", label: "Brand Voice" },
  { value: "CAMPAIGN_HISTORY", label: "Campaign History" },
  { value: "PREVIOUS_CONTENT", label: "Previous Content" },
  { value: "APPROVED_CLAIMS", label: "Approved Claims" },
  { value: "RESTRICTED_CLAIMS", label: "Restricted Claims" },
  { value: "VISUAL_GUIDELINES", label: "Visual Guidelines" },
  { value: "MARKETING_OBJECTIVES", label: "Marketing Objectives" },
];

const categoryLabel = (value: string) =>
  CATEGORIES.find((c) => c.value === value)?.label ?? value;

export function KnowledgeBase({
  brandId,
  initialEntries,
  canEdit,
}: {
  brandId: string;
  initialEntries: BrandKnowledgeEntry[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [showForm, setShowForm] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim() || !content.trim()) {
      setError("Title and content are both required.");
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/brands/${brandId}/knowledge`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, title, content }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setEntries((prev) => [data.knowledge, ...prev]);
    setTitle("");
    setContent("");
    setShowForm(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    const prev = entries;
    setEntries((e) => e.filter((entry) => entry.id !== id));
    const res = await fetch(`/api/brands/${brandId}/knowledge/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      setEntries(prev);
    } else {
      router.refresh();
    }
  }

  const visibleEntries = filter ? entries.filter((e) => e.category === filter) : entries;
  const usedCategories = Array.from(new Set(entries.map((e) => e.category)));

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg text-ink">Knowledge base</h2>
          <p className="mt-1 text-sm text-muted">
            What every AI agent reads before generating content for this brand.
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-lg bg-indigo px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-dark"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showForm ? "Cancel" : "Add entry"}
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleAdd}
          className="mt-5 space-y-3 rounded-lg border border-border bg-canvas p-4"
        >
          <div>
            <label className="block text-sm font-medium text-ink">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-indigo focus:outline-none focus:ring-1 focus:ring-indigo"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-indigo focus:outline-none focus:ring-1 focus:ring-indigo"
              placeholder="e.g. Return policy"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink focus:border-indigo focus:outline-none focus:ring-1 focus:ring-indigo"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo px-4 py-2 text-sm font-medium text-white hover:bg-indigo-dark disabled:opacity-60"
          >
            {loading ? "Adding…" : "Add to knowledge base"}
          </button>
        </form>
      )}

      {entries.length === 0 ? (
        <div className="mt-6 flex flex-col items-center rounded-lg border border-dashed border-border py-10 text-center">
          <FileText className="h-5 w-5 text-muted" />
          <p className="mt-3 text-sm font-medium text-ink">No knowledge added yet</p>
          <p className="mt-1 max-w-xs text-sm text-muted">
            Add FAQs, approved claims, USPs, and more so AI agents never
            invent brand facts.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-5 flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilter(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                filter === null ? "bg-indigo text-white" : "bg-canvas text-muted"
              }`}
            >
              All ({entries.length})
            </button>
            {usedCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  filter === cat ? "bg-indigo text-white" : "bg-canvas text-muted"
                }`}
              >
                {categoryLabel(cat)}
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-3">
            {visibleEntries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-lg border border-border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded border border-border px-1.5 py-0.5 text-[0.63rem] font-medium text-muted">
                      {categoryLabel(entry.category)}
                    </span>
                    <p className="mt-1.5 text-sm font-medium text-ink">{entry.title}</p>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="shrink-0 rounded-md p-1.5 text-muted hover:bg-danger-light hover:text-danger"
                      aria-label="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-ink/70">
                  {entry.content}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
