"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Menu, X, LogOut, ChevronDown, ShieldCheck } from "lucide-react";
import { NAV } from "@/lib/nav";
import { ROLE_LABELS, type AppRole } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./NotificationBell";

function currentPageLabel(pathname: string): string {
  for (const group of NAV) {
    for (const item of group.items) {
      if (pathname === item.href || pathname.startsWith(item.href + "/")) {
        return item.label;
      }
    }
  }
  return "Dashboard";
}

export function TopBar({
  user,
}: {
  user: { name: string; email: string; role: string; isPlatformAdmin?: boolean };
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const roleLabel = ROLE_LABELS[user.role as AppRole] ?? user.role;
  const initial = user.name?.[0]?.toUpperCase() ?? "?";

  return (
    <>
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-1.5 text-ink hover:bg-canvas lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-display text-lg text-ink">
            {currentPageLabel(pathname ?? "")}
          </h1>
        </div>

        <div className="flex items-center gap-1.5">
        <NotificationBell />
        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-canvas"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-light text-sm font-medium text-indigo">
              {initial}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight text-ink">{user.name}</p>
              <p className="text-xs leading-tight text-muted">{roleLabel}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-muted sm:block" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 z-20 mt-2 w-52 rounded-lg border border-border bg-surface py-1.5 shadow-card">
                <div className="border-b border-border px-3.5 py-2.5">
                  <p className="text-sm font-medium text-ink">{user.name}</p>
                  <p className="truncate text-xs text-muted">{user.email}</p>
                </div>
                {user.isPlatformAdmin && (
                  <Link
                    href="/platform-admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-ink hover:bg-canvas"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Platform Admin
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-ink hover:bg-canvas"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-ink">
            <div className="flex items-center justify-between px-5 py-5">
              <div className="flex items-center gap-2.5">
                <Image src="/brandloop-icon.png" alt="" width={28} height={28} className="h-7 w-7" />
                <span className="font-display text-lg text-canvas">Brandloop</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1.5 text-canvas/70 hover:bg-canvas/10"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-6 overflow-y-auto px-3 pb-6">
              {NAV.map((group) => (
                <div key={group.label}>
                  <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-wider text-canvas/35">
                    {group.label}
                  </p>
                  <div className="mt-1.5 space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      if (item.status === "phase") {
                        return (
                          <div
                            key={item.label}
                            className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-canvas/35"
                          >
                            <span className="flex items-center gap-2.5">
                              <Icon className="h-4 w-4" />
                              {item.label}
                            </span>
                            <span className="rounded border border-canvas/15 px-1.5 py-0.5 text-[0.63rem] text-canvas/40">
                              {item.phaseLabel}
                            </span>
                          </div>
                        );
                      }
                      const active =
                        pathname === item.href || pathname?.startsWith(item.href + "/");
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium",
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
          </div>
        </div>
      )}
    </>
  );
}
