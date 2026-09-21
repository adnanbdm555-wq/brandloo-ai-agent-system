import { cn } from "@/lib/utils";

export function DashboardCard({
  label,
  value,
  phaseLabel,
  className,
}: {
  label: string;
  value: string | number;
  phaseLabel?: string;
  className?: string;
}) {
  const isPending = value === "—";

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface px-5 py-4 shadow-card",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted">{label}</p>
        {phaseLabel && (
          <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[0.63rem] font-medium text-muted">
            {phaseLabel}
          </span>
        )}
      </div>
      <p
        className={cn(
          "mt-2 font-display text-2xl",
          isPending ? "text-muted/50" : "text-ink"
        )}
      >
        {value}
      </p>
    </div>
  );
}
