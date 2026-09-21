"use client";

import { useState } from "react";
import { ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import type { Brand, ContentItem } from "@/db/schema";
import { ContentDetailPanel } from "./ContentDetailPanel";

const QA_STYLES: Record<string, string> = {
  NOT_RUN: "bg-canvas text-muted",
  PASS: "bg-success-light text-success",
  WARNINGS: "bg-amber-light text-amber-dark",
  FAIL: "bg-danger-light text-danger",
};

export function ApprovalCenter({
  brands,
  initialItems,
  canApproveContent,
}: {
  brands: Brand[];
  initialItems: ContentItem[];
  canApproveContent: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [selected, setSelected] = useState<ContentItem | null>(null);

  function brandName(id: string) {
    return brands.find((b) => b.id === id)?.name ?? "";
  }

  const pending = items.filter((i) => i.status === "PENDING_APPROVAL");

  return (
    <div>
      {pending.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface py-16 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-success-light text-success">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-medium text-ink">Nothing waiting for review</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Content submitted from the Content Calendar shows up here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {pending.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelected(item)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-surface p-5 text-left shadow-card transition hover:border-indigo/40"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{item.title}</p>
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.68rem] font-medium ${QA_STYLES[item.qaStatus] ?? ""}`}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    {item.qaStatus.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {brandName(item.brandId)} · {item.platform} · {item.contentType}
                </p>
                <p className="mt-2 line-clamp-2 text-sm text-ink/70">{item.body}</p>
              </div>
              <Clock className="h-4 w-4 shrink-0 text-muted" />
            </button>
          ))}
        </div>
      )}

      {selected && (
        <ContentDetailPanel
          item={selected}
          canEditContent={canApproveContent}
          canApproveContent={canApproveContent}
          onClose={() => setSelected(null)}
          onSaved={(updated) => {
            setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
            if (updated.status !== "PENDING_APPROVAL") setSelected(null);
          }}
          onDeleted={(id) => {
            setItems((prev) => prev.filter((i) => i.id !== id));
            setSelected(null);
          }}
        />
      )}
    </div>
  );
}
