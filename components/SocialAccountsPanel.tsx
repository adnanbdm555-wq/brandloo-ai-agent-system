"use client";

import { useState } from "react";
import { Plus, X, Trash2 } from "lucide-react";
import type { SocialAccount } from "@/db/schema";

const PLATFORMS = ["INSTAGRAM", "FACEBOOK", "LINKEDIN", "YOUTUBE", "TIKTOK", "X"] as const;
const PLATFORM_LABELS: Record<string, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  LINKEDIN: "LinkedIn",
  YOUTUBE: "YouTube",
  TIKTOK: "TikTok",
  X: "X",
};

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-indigo focus:outline-none focus:ring-1 focus:ring-indigo";

export function SocialAccountsPanel({
  brandId,
  initialAccounts,
  canEdit,
}: {
  brandId: string;
  initialAccounts: SocialAccount[];
  canEdit: boolean;
}) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [showForm, setShowForm] = useState(false);
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("INSTAGRAM");
  const [accountName, setAccountName] = useState("");
  const [profileUrl, setProfileUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accountName.trim()) {
      setError("Enter the account name or handle.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/social-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandId, platform, accountName, profileUrl }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setAccounts((prev) => [data.account, ...prev]);
    setAccountName("");
    setProfileUrl("");
    setShowForm(false);
  }

  async function remove(id: string) {
    const prev = accounts;
    setAccounts((a) => a.filter((x) => x.id !== id));
    const res = await fetch(`/api/social-accounts/${id}`, { method: "DELETE" });
    if (!res.ok) setAccounts(prev);
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base text-ink">Social accounts</h2>
        {canEdit && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="rounded-md p-1.5 text-muted hover:bg-canvas"
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={add} className="mt-3 space-y-2 rounded-lg border border-border bg-canvas p-3">
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as (typeof PLATFORMS)[number])}
            className={inputClass}
          >
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {PLATFORM_LABELS[p]}
              </option>
            ))}
          </select>
          <input
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            placeholder="@handle or account name"
            className={inputClass}
          />
          <input
            value={profileUrl}
            onChange={(e) => setProfileUrl(e.target.value)}
            placeholder="Profile URL (optional)"
            className={inputClass}
          />
          {error && <p className="text-xs text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo px-3 py-2 text-sm font-medium text-white hover:bg-indigo-dark disabled:opacity-60"
          >
            {loading ? "Adding…" : "Add account"}
          </button>
        </form>
      )}

      {accounts.length === 0 ? (
        <p className="mt-3 text-sm text-muted">No accounts on file yet.</p>
      ) : (
        <div className="mt-3 space-y-2">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center justify-between text-sm">
              <div>
                <span className="text-ink">{a.accountName}</span>
                <span className="ml-2 text-xs text-muted">{PLATFORM_LABELS[a.platform]}</span>
              </div>
              {canEdit && (
                <button
                  onClick={() => remove(a.id)}
                  className="rounded p-1 text-muted hover:bg-danger-light hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
