"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCheck, Bell } from "lucide-react";
import type { Notification } from "@/db/schema";

function timeAgo(date: string | Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function NotificationsList({ initialItems }: { initialItems: Notification[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const unreadCount = items.filter((n) => !n.read).length;

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await fetch("/api/notifications/read-all", { method: "POST" });
  }

  async function open(n: Notification) {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      fetch(`/api/notifications/${n.id}/read`, { method: "POST" }).catch(() => {});
    }
    if (n.link) router.push(n.link);
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface py-16 text-center">
        <Bell className="h-5 w-5 text-muted" />
        <p className="mt-3 text-sm font-medium text-ink">Nothing yet</p>
        <p className="mt-1 max-w-xs text-sm text-muted">
          Submissions, approvals, and rejections you're involved in show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-surface shadow-card">
      {unreadCount > 0 && (
        <div className="flex justify-end border-b border-border px-4 py-2.5">
          <button
            onClick={markAllRead}
            className="flex items-center gap-1 text-xs font-medium text-indigo hover:text-indigo-dark"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </button>
        </div>
      )}
      {items.map((n) => (
        <button
          key={n.id}
          onClick={() => open(n)}
          className={`block w-full border-b border-border px-5 py-4 text-left last:border-0 hover:bg-canvas ${
            n.read ? "" : "bg-indigo-light/40"
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-ink">{n.title}</p>
            {!n.read && <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo" />}
          </div>
          {n.body && <p className="mt-1 text-sm text-ink/70">{n.body}</p>}
          <p className="mt-1.5 text-xs text-muted">{timeAgo(n.createdAt)}</p>
        </button>
      ))}
    </div>
  );
}
