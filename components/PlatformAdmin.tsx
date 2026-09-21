"use client";

import { useState } from "react";
import { RefreshCw, Play, Ban, XCircle, Clock3, Users } from "lucide-react";
import type { Agency, Subscription, Invoice } from "@/db/schema";

type AgencyRow = {
  agency: Agency;
  subscription: Subscription | null;
  memberCount: number;
  recentInvoices: Invoice[];
};

const STATUS_STYLES: Record<string, string> = {
  TRIALING: "bg-indigo-light text-indigo",
  ACTIVE: "bg-success-light text-success",
  PAST_DUE: "bg-amber-light text-amber-dark",
  SUSPENDED: "bg-danger-light text-danger",
  CANCELED: "bg-canvas text-muted",
};

export function PlatformAdmin({ initialAgencies }: { initialAgencies: AgencyRow[] }) {
  const [rows, setRows] = useState(initialAgencies);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [runningCycle, setRunningCycle] = useState(false);
  const [cycleResult, setCycleResult] = useState<string | null>(null);

  async function callAction(subscriptionId: string, action: string, body?: object) {
    setBusyId(subscriptionId);
    const res = await fetch(`/api/platform-admin/subscriptions/${subscriptionId}/${action}`, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    setBusyId(null);
    if (res.ok) {
      setRows((prev) =>
        prev.map((r) =>
          r.subscription?.id === subscriptionId ? { ...r, subscription: data.subscription } : r
        )
      );
    }
  }

  async function runBillingCycleNow() {
    setRunningCycle(true);
    setCycleResult(null);
    const res = await fetch("/api/platform-admin/billing-run", { method: "POST" });
    const data = await res.json();
    setRunningCycle(false);
    if (res.ok) {
      setCycleResult(`Checked all subscriptions — ${data.events.length} event(s) triggered.`);
    } else {
      setCycleResult(data.error ?? "Failed to run billing check.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{rows.length} agencies on this install</p>
        <button
          onClick={runBillingCycleNow}
          disabled={runningCycle}
          className="flex items-center gap-1.5 rounded-lg bg-indigo px-3.5 py-2 text-sm font-medium text-white hover:bg-indigo-dark disabled:opacity-60"
        >
          {runningCycle ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
          Run billing check now
        </button>
      </div>
      {cycleResult && (
        <p className="mt-3 rounded-lg bg-indigo-light px-4 py-2.5 text-sm text-indigo">{cycleResult}</p>
      )}

      <div className="mt-5 space-y-3">
        {rows.map(({ agency, subscription, memberCount, recentInvoices }) => (
          <div key={agency.id} className="rounded-xl border border-border bg-surface p-5 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-ink">{agency.name}</p>
                  {subscription && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[0.63rem] font-medium ${STATUS_STYLES[subscription.status]}`}
                    >
                      {subscription.status.replace("_", " ")}
                    </span>
                  )}
                </div>
                <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                  <Users className="h-3 w-3" />
                  {memberCount} member{memberCount === 1 ? "" : "s"}
                  {subscription && (
                    <>
                      {" "}
                      · {subscription.priceAmount.toLocaleString()} PKR / {subscription.billingPeriodDays}d
                    </>
                  )}
                </p>
                {subscription?.status === "TRIALING" && (
                  <p className="mt-1 text-xs text-muted">
                    Trial ends {new Date(subscription.trialEndsAt).toLocaleDateString()}
                  </p>
                )}
              </div>

              {subscription && (
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
                  <button
                    onClick={() => callAction(subscription.id, "activate")}
                    disabled={busyId === subscription.id}
                    className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-success hover:bg-success-light disabled:opacity-60"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => callAction(subscription.id, "extend-trial", { days: 7 })}
                    disabled={busyId === subscription.id}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-ink hover:bg-canvas disabled:opacity-60"
                  >
                    <Clock3 className="h-3 w-3" />
                    +7d trial
                  </button>
                  <button
                    onClick={() => callAction(subscription.id, "suspend")}
                    disabled={busyId === subscription.id}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-danger hover:bg-danger-light disabled:opacity-60"
                  >
                    <Ban className="h-3 w-3" />
                    Suspend
                  </button>
                  <button
                    onClick={() => callAction(subscription.id, "cancel")}
                    disabled={busyId === subscription.id}
                    className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-canvas disabled:opacity-60"
                  >
                    <XCircle className="h-3 w-3" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {recentInvoices.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border pt-3">
                {recentInvoices.map((inv) => (
                  <span
                    key={inv.id}
                    className={`rounded border px-1.5 py-0.5 text-[0.63rem] ${
                      inv.status === "PAID"
                        ? "border-success/20 text-success"
                        : "border-border text-muted"
                    }`}
                  >
                    {inv.invoiceNumber} · {inv.status}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
