"use client";

import { useState, useEffect } from "react";
import { Clock, CreditCard, CheckCircle2, AlertTriangle } from "lucide-react";
import type { Subscription, Invoice } from "@/db/schema";

const STATUS_STYLES: Record<string, string> = {
  TRIALING: "bg-indigo-light text-indigo",
  ACTIVE: "bg-success-light text-success",
  PAST_DUE: "bg-amber-light text-amber-dark",
  SUSPENDED: "bg-danger-light text-danger",
  CANCELED: "bg-canvas text-muted",
};

const INVOICE_STYLES: Record<string, string> = {
  PENDING: "bg-amber-light text-amber-dark",
  PAID: "bg-success-light text-success",
  OVERDUE: "bg-danger-light text-danger",
  CANCELED: "bg-canvas text-muted",
};

function daysLeft(date: string | Date): number {
  return Math.ceil((new Date(date).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export function BillingView({ canPay }: { canPay: boolean }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notConfigured, setNotConfigured] = useState(false);

  useEffect(() => {
    fetch("/api/billing/subscription")
      .then((r) => r.json())
      .then((data) => {
        setSubscription(data.subscription);
        setInvoices(data.invoices ?? []);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  async function payInvoice(invoiceId: string) {
    setPayingId(invoiceId);
    setError(null);
    setNotConfigured(false);
    const res = await fetch(`/api/billing/invoices/${invoiceId}/checkout`, { method: "POST" });
    const data = await res.json();
    setPayingId(null);
    if (!res.ok) {
      if (res.status === 503) setNotConfigured(true);
      else setError(data.error ?? "Something went wrong.");
      return;
    }
    window.location.href = data.checkoutUrl;
  }

  if (!loaded) return null;

  if (!subscription) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center text-sm text-muted">
        No subscription found for this workspace.
      </div>
    );
  }

  const trialDaysLeft = subscription.status === "TRIALING" ? daysLeft(subscription.trialEndsAt) : null;

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink">{subscription.planName} Plan</p>
            <p className="mt-0.5 text-2xl font-display text-ink">
              {subscription.priceAmount.toLocaleString()} PKR
              <span className="text-sm font-sans font-normal text-muted"> / {subscription.billingPeriodDays} days</span>
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[subscription.status]}`}>
            {subscription.status.replace("_", " ")}
          </span>
        </div>

        {subscription.status === "TRIALING" && trialDaysLeft !== null && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-indigo-light px-4 py-3 text-sm text-indigo">
            <Clock className="h-4 w-4 shrink-0" />
            {trialDaysLeft > 0
              ? `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your free trial.`
              : "Your trial has ended."}
          </div>
        )}

        {subscription.status === "SUSPENDED" && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-danger-light px-4 py-3 text-sm text-danger">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Access is paused until an outstanding invoice is paid.
          </div>
        )}

        {subscription.status === "ACTIVE" && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-success-light px-4 py-3 text-sm text-success">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Your workspace is active.
          </div>
        )}
      </div>

      {notConfigured && (
        <div className="rounded-lg bg-amber-light px-4 py-3 text-sm text-ink/80">
          Payments aren&apos;t configured on this server yet
          (<code className="rounded bg-ink/5 px-1">SAFEPAY_API_KEY</code>). Contact your workspace owner.
        </div>
      )}
      {error && (
        <p className="rounded-lg bg-danger-light px-4 py-2.5 text-sm text-danger">{error}</p>
      )}

      <div className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <h2 className="font-display text-lg text-ink">Invoices</h2>
        {invoices.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No invoices yet — generated automatically when your trial ends.</p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium text-ink">{inv.invoiceNumber}</p>
                  <p className="text-xs text-muted">
                    {inv.amount.toLocaleString()} {inv.currency} · due{" "}
                    {new Date(inv.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[0.68rem] font-medium ${INVOICE_STYLES[inv.status]}`}>
                    {inv.status}
                  </span>
                  {(inv.status === "PENDING" || inv.status === "OVERDUE") && canPay && (
                    <button
                      onClick={() => payInvoice(inv.id)}
                      disabled={payingId === inv.id}
                      className="flex items-center gap-1 rounded-lg bg-indigo px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-dark disabled:opacity-60"
                    >
                      <CreditCard className="h-3 w-3" />
                      {payingId === inv.id ? "Starting…" : "Pay now"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
