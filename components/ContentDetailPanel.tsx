"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Trash2,
  Hash,
  ShieldCheck,
  RefreshCw,
  Send,
  Check,
  Palette,
  Clapperboard,
  Clock,
} from "lucide-react";
import type { ContentItem, ContentApprovalEvent } from "@/db/schema";

const inputClass =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink focus:border-indigo focus:outline-none focus:ring-1 focus:ring-indigo";

function parseArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const arr = JSON.parse(value);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-canvas text-muted border-border",
  READY: "bg-success-light text-success border-success/20",
  PENDING_APPROVAL: "bg-amber-light text-amber-dark border-amber/20",
  APPROVED: "bg-success-light text-success border-success/20",
  REJECTED: "bg-danger-light text-danger border-danger/20",
};

const QA_STYLES: Record<string, string> = {
  NOT_RUN: "bg-canvas text-muted",
  PASS: "bg-success-light text-success",
  WARNINGS: "bg-amber-light text-amber-dark",
  FAIL: "bg-danger-light text-danger",
};

export function ContentDetailPanel({
  item,
  canEditContent,
  canApproveContent,
  onClose,
  onSaved,
  onDeleted,
}: {
  item: ContentItem;
  canEditContent: boolean;
  canApproveContent: boolean;
  onClose: () => void;
  onSaved: (item: ContentItem) => void;
  onDeleted: (id: string) => void;
}) {
  const [current, setCurrent] = useState(item);
  const [body, setBody] = useState(item.body);
  const [status, setStatus] = useState<"DRAFT" | "READY">(
    item.status === "DRAFT" || item.status === "READY" ? item.status : "DRAFT"
  );
  const [scheduledDate, setScheduledDate] = useState(
    item.scheduledDate ? toDateKey(new Date(item.scheduledDate)) : ""
  );
  const [saving, setSaving] = useState(false);
  const [qaLoading, setQaLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [notConfigured, setNotConfigured] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectBox, setShowRejectBox] = useState(false);
  const [events, setEvents] = useState<
    (ContentApprovalEvent & { actorName: string | null })[]
  >([]);

  const hashtags = parseArray(current.hashtags);
  const qaIssues = parseArray(current.qaSummary ? current.qaIssues : null);

  useEffect(() => {
    fetch(`/api/content/${item.id}/events`)
      .then((r) => r.json())
      .then((data) => setEvents(data.events ?? []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/content/${current.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, status, scheduledDate: scheduledDate || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setCurrent(data.content);
      onSaved(data.content);
    }
  }

  async function remove() {
    if (!confirm("Delete this content item?")) return;
    const res = await fetch(`/api/content/${current.id}`, { method: "DELETE" });
    if (res.ok) onDeleted(current.id);
  }

  async function runQA() {
    setQaLoading(true);
    setNotConfigured(false);
    const res = await fetch(`/api/content/${current.id}/qa`, { method: "POST" });
    const data = await res.json();
    setQaLoading(false);
    if (!res.ok) {
      if (res.status === 503) setNotConfigured(true);
      return;
    }
    setCurrent(data.content);
    onSaved(data.content);
  }

  async function submitForApproval() {
    setActionLoading(true);
    const res = await fetch(`/api/content/${current.id}/submit`, { method: "POST" });
    const data = await res.json();
    setActionLoading(false);
    if (res.ok) {
      setCurrent(data.content);
      onSaved(data.content);
      refreshEvents();
    }
  }

  async function approve() {
    setActionLoading(true);
    const res = await fetch(`/api/content/${current.id}/approve`, { method: "POST" });
    const data = await res.json();
    setActionLoading(false);
    if (res.ok) {
      setCurrent(data.content);
      onSaved(data.content);
      refreshEvents();
    }
  }

  async function reject() {
    if (!rejectNotes.trim()) return;
    setActionLoading(true);
    const res = await fetch(`/api/content/${current.id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: rejectNotes }),
    });
    const data = await res.json();
    setActionLoading(false);
    if (res.ok) {
      setCurrent(data.content);
      onSaved(data.content);
      setShowRejectBox(false);
      setRejectNotes("");
      refreshEvents();
    }
  }

  function refreshEvents() {
    fetch(`/api/content/${current.id}/events`)
      .then((r) => r.json())
      .then((data) => setEvents(data.events ?? []))
      .catch(() => {});
  }

  const canSubmit =
    canEditContent &&
    (current.status === "DRAFT" ||
      current.status === "READY" ||
      current.status === "REJECTED");
  const isPending = current.status === "PENDING_APPROVAL";
  const isLockedStatus = current.status === "PENDING_APPROVAL" || current.status === "APPROVED";

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative flex w-full max-w-md flex-col bg-surface shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-medium text-ink">{current.title}</p>
            <p className="text-xs text-muted">
              {current.platform} · {current.contentType}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted hover:bg-canvas">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[current.status] ?? ""}`}
            >
              {current.status.replace("_", " ")}
            </span>
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${QA_STYLES[current.qaStatus] ?? ""}`}
            >
              <ShieldCheck className="h-3 w-3" />
              QA: {current.qaStatus.replace("_", " ")}
            </span>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Post text</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              disabled={isLockedStatus}
              className={`${inputClass} mt-1.5 disabled:opacity-60`}
            />
          </div>

          {hashtags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-muted" />
              {hashtags.map((h) => (
                <span key={h} className="text-xs text-indigo">
                  {h}
                </span>
              ))}
            </div>
          )}

          {!isLockedStatus && current.status !== "REJECTED" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "DRAFT" | "READY")}
                  className={`${inputClass} mt-1.5`}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="READY">Ready</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">Scheduled date</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className={`${inputClass} mt-1.5`}
                />
              </div>
            </div>
          )}

          {/* QA */}
          <div className="rounded-lg border border-border p-3.5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-1.5 text-sm font-medium text-ink">
                <ShieldCheck className="h-4 w-4 text-amber" />
                QA check
              </p>
              {canEditContent && (
                <button
                  onClick={runQA}
                  disabled={qaLoading}
                  className="flex items-center gap-1 text-xs font-medium text-indigo hover:text-indigo-dark disabled:opacity-60"
                >
                  {qaLoading && <RefreshCw className="h-3 w-3 animate-spin" />}
                  {current.qaStatus === "NOT_RUN" ? "Run check" : "Re-run"}
                </button>
              )}
            </div>
            {notConfigured && (
              <p className="mt-2 text-xs text-ink/70">
                Needs <code className="rounded bg-ink/5 px-1">ANTHROPIC_API_KEY</code> configured to run.
              </p>
            )}
            {current.qaSummary && (
              <p className="mt-2 text-xs text-ink/70">{current.qaSummary}</p>
            )}
            {qaIssues.length > 0 && (
              <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-ink/70">
                {qaIssues.map((issue, i) => (
                  <li key={i}>{issue}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Creative / video links */}
          <div className="flex gap-2">
            <Link
              href={`/creative-studio?contentId=${current.id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-ink hover:bg-canvas"
            >
              <Palette className="h-3.5 w-3.5" />
              Creative brief
            </Link>
            <Link
              href={`/video-studio?contentId=${current.id}`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium text-ink hover:bg-canvas"
            >
              <Clapperboard className="h-3.5 w-3.5" />
              Video script
            </Link>
          </div>

          {/* Approval actions */}
          {isPending && canApproveContent && (
            <div className="rounded-lg border border-amber/30 bg-amber-light p-3.5">
              <p className="text-sm font-medium text-ink">Awaiting your review</p>
              {!showRejectBox ? (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={approve}
                    disabled={actionLoading}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-success px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectBox(true)}
                    className="flex-1 rounded-lg border border-danger/30 px-3 py-2 text-sm font-medium text-danger hover:bg-danger-light"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="What needs to change?"
                    rows={2}
                    className={inputClass}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={reject}
                      disabled={actionLoading || !rejectNotes.trim()}
                      className="flex-1 rounded-lg bg-danger px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                    >
                      Confirm reject
                    </button>
                    <button
                      onClick={() => setShowRejectBox(false)}
                      className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-canvas"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {isPending && !canApproveContent && (
            <div className="rounded-lg border border-amber/30 bg-amber-light p-3.5 text-sm text-ink/70">
              Submitted — waiting on an approver.
            </div>
          )}

          {events.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Clock className="h-3.5 w-3.5" />
                History
              </p>
              <div className="mt-2 space-y-2">
                {events.map((e) => (
                  <div key={e.id} className="text-xs text-ink/70">
                    <span className="font-medium text-ink">{e.action}</span>
                    {e.actorName ? ` by ${e.actorName}` : ""}
                    {e.notes ? ` — ${e.notes}` : ""}
                  </div>
                ))}
              </div>
            </div>
          )}

          {current.sourceBrief && (
            <div className="rounded-lg bg-canvas px-3.5 py-3 text-xs text-muted">
              <span className="font-medium text-ink/70">Original brief: </span>
              {current.sourceBrief}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-4">
          {canEditContent ? (
            <button
              onClick={remove}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-danger hover:bg-danger-light"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            {canSubmit && !isLockedStatus && (
              <button
                onClick={submitForApproval}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-lg border border-indigo px-3.5 py-2 text-sm font-medium text-indigo hover:bg-indigo-light disabled:opacity-60"
              >
                <Send className="h-3.5 w-3.5" />
                Submit for approval
              </button>
            )}
            {canEditContent && !isLockedStatus && (
              <button
                onClick={save}
                disabled={saving}
                className="rounded-lg bg-indigo px-4 py-2 text-sm font-medium text-white hover:bg-indigo-dark disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
