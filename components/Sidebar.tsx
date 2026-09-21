"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { NAV } from "@/lib/nav";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-border bg-ink lg:flex">
      <div className="flex items-center gap-2.5 px-6 py-6">
        <Image src="/brandloop-icon.png" alt="" width={32} height={32} className="h-8 w-8" />
        <span className="font-display text-lg text-canvas">Brandloop</span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
        {NAV.map((group) => (
          <div key={group.label}>
            <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-wider text-canvas/35">
              {group.label}
            </p>
            <div className="mt-1.5 space-y-0.5">
              {group.items.map((item) => {
                const active =
                  item.status === "live" &&
                  (pathname === item.href || pathname?.startsWith(item.href + "/"));
                const Icon = item.icon;

                if (item.status === "phase") {
                  return (
                    <div
                      key={item.label}
                      title={`${item.label} — ${item.phaseLabel}`}
                      className="flex cursor-default items-center justify-between rounded-lg px-3 py-2 text-sm text-canvas/35"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      <span className="rounded border border-canvas/15 px-1.5 py-0.5 text-[0.63rem] font-medium text-canvas/40">
                        {item.phaseLabel}
                      </span>
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-canvas/10 text-canvas"
                        : "text-canvas/70 hover:bg-canvas/5 hover:text-canvas"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
