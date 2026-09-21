"use client";

import { useState } from "react";
import { Copy, Check, Trash2, ShieldCheck } from "lucide-react";
import { ROLES, ROLE_LABELS, type AppRole } from "@/lib/roles";

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function UsersRoles({
  currentUserId,
  initialMembers,
  agencyName,
  inviteCode,
}: {
  currentUserId: string;
  initialMembers: Member[];
  agencyName: string;
  inviteCode: string;
}) {
  const [members, setMembers] = useState(initialMembers);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/register?invite=${inviteCode}`
      : "";

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl || inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function changeRole(userId: string, role: string) {
    setError(null);
    const prev = members;
    setMembers((m) => m.map((u) => (u.id === userId ? { ...u, role } : u)));
    const res = await fetch(`/api/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const data = await res.json();
      setMembers(prev);
      setError(data.error ?? "Couldn't update that role.");
    }
  }

  async function removeMember(userId: string) {
    if (!confirm("Remove this teammate from the agency?")) return;
    setError(null);
    const prev = members;
    setMembers((m) => m.filter((u) => u.id !== userId));
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setMembers(prev);
      setError(data.error ?? "Couldn't remove that teammate.");
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <h2 className="font-display text-lg text-ink">{agencyName}</h2>
        <p className="mt-1 text-sm text-muted">
          Share this invite code with teammates — anyone with it can join as
          a Marketing Manager.
        </p>
        <div className="mt-3 flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-canvas px-3.5 py-2.5 text-sm text-ink">
            {inviteUrl || inviteCode}
          </code>
          <button
            onClick={copyInvite}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3.5 py-2.5 text-sm font-medium text-ink hover:bg-canvas"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-success" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-danger-light px-4 py-2.5 text-sm text-danger">{error}</p>
      )}

      <div className="rounded-xl border border-border bg-surface shadow-card">
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-lg text-ink">
            Teammates ({members.length})
          </h2>
        </div>
        <div className="divide-y divide-border">
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-6 py-4">
              <div>
                <p className="text-sm font-medium text-ink">
                  {m.name}
                  {m.id === currentUserId && (
                    <span className="ml-1.5 text-xs text-muted">(you)</span>
                  )}
                </p>
                <p className="text-xs text-muted">{m.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={m.role}
                  onChange={(e) => changeRole(m.id, e.target.value)}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r as AppRole]}
                    </option>
                  ))}
                </select>
                {m.role === "SUPER_ADMIN" && (
                  <ShieldCheck className="h-4 w-4 text-indigo" />
                )}
                {m.id !== currentUserId && (
                  <button
                    onClick={() => removeMember(m.id)}
                    className="rounded p-1.5 text-muted hover:bg-danger-light hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
