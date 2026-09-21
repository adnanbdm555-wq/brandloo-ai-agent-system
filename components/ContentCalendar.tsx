"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Brand, ContentItem } from "@/db/schema";
import { ContentDetailPanel } from "./ContentDetailPanel";

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

export function ContentCalendar({
  brands,
  initialItems,
  canEditContent,
  canApproveContent,
}: {
  brands: Brand[];
  initialItems: ContentItem[];
  canEditContent: boolean;
  canApproveContent: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const [items, setItems] = useState(initialItems);
  const [brandFilter, setBrandFilter] = useState<string>("all");
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState<ContentItem | null>(null);

  useEffect(() => {
    if (highlightId) {
      const found = items.find((i) => i.id === highlightId);
      if (found) setSelected(found);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlightId]);

  const filtered = useMemo(
    () => (brandFilter === "all" ? items : items.filter((i) => i.brandId === brandFilter)),
    [items, brandFilter]
  );

  const scheduled = filtered.filter((i) => i.scheduledDate);
  const unscheduled = filtered.filter((i) => !i.scheduledDate);

  const byDate = useMemo(() => {
    const map = new Map<string, ContentItem[]>();
    for (const item of scheduled) {
      const key = toDateKey(new Date(item.scheduledDate!));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return map;
  }, [scheduled]);

  const monthLabel = cursor.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const gridDays = useMemo(() => {
    const firstOfMonth = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const startOffset = firstOfMonth.getDay();
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(gridStart.getDate() - startOffset);

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return d;
    });
  }, [cursor]);

  function brandName(id: string) {
    return brands.find((b) => b.id === id)?.name ?? "";
  }

  async function quickSchedule(item: ContentItem, dateKey: string) {
    const res = await fetch(`/api/content/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scheduledDate: dateKey }),
    });
    const data = await res.json();
    if (res.ok) {
      setItems((prev) => prev.map((i) => (i.id === item.id ? data.content : i)));
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            className="rounded-md border border-border p-1.5 hover:bg-canvas"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="w-40 text-center font-display text-lg text-ink">{monthLabel}</h2>
          <button
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            className="rounded-md border border-border p-1.5 hover:bg-canvas"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

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

      <div className="mt-5 grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-card">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="bg-canvas px-2 py-2 text-center text-xs font-medium text-muted">
            {d}
          </div>
        ))}
        {gridDays.map((day) => {
          const key = toDateKey(day);
          const inMonth = day.getMonth() === cursor.getMonth();
          const dayItems = byDate.get(key) ?? [];
          return (
            <div
              key={key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const itemId = e.dataTransfer.getData("text/plain");
                const item = items.find((i) => i.id === itemId);
                if (item) quickSchedule(item, key);
              }}
              className={`min-h-[6.5rem] bg-surface p-1.5 ${inMonth ? "" : "opacity-40"}`}
            >
              <p className="px-0.5 text-xs text-muted">{day.getDate()}</p>
              <div className="mt-1 space-y-1">
                {dayItems.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
                    onClick={() => setSelected(item)}
                    className={`block w-full truncate rounded border px-1.5 py-1 text-left text-[0.68rem] font-medium ${STATUS_STYLES[item.status] ?? ""}`}
                    title={item.title}
                  >
                    {item.title}
                  </button>
                ))}
                {dayItems.length > 3 && (
                  <p className="px-1 text-[0.63rem] text-muted">+{dayItems.length - 3} more</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface p-5 shadow-card">
        <h3 className="font-display text-base text-ink">
          Unscheduled ({unscheduled.length})
        </h3>
        <p className="mt-1 text-xs text-muted">Drag onto a date, or click to set one.</p>
        {unscheduled.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Nothing waiting to be scheduled.</p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {unscheduled.map((item) => (
              <button
                key={item.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("text/plain", item.id)}
                onClick={() => setSelected(item)}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink hover:border-indigo/40"
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${item.status === "READY" ? "bg-success" : "bg-muted"}`}
                />
                {item.title}
                <span className="text-muted">· {brandName(item.brandId)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <ContentDetailPanel
          item={selected}
          canEditContent={canEditContent}
          canApproveContent={canApproveContent}
          onClose={() => {
            setSelected(null);
            if (highlightId) router.replace("/content-calendar");
          }}
          onSaved={(updated) => {
            setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          }}
          onDeleted={(id) => {
            setItems((prev) => prev.filter((i) => i.id !== id));
            setSelected(null);
            if (highlightId) router.replace("/content-calendar");
          }}
        />
      )}
    </div>
  );
}
