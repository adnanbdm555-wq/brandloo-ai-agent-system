import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // Checked fresh on every request (not cached in the session/JWT) so a
  // suspension — whether automatic from the billing cron or a manual
  // platform-admin action — takes effect immediately, not just at next
  // login. /billing itself lives outside this layout specifically so a
  // suspended agency can still reach it to pay.
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.agencyId, session.user.agencyId))
    .limit(1);

  if (subscription?.status === "SUSPENDED") {
    redirect("/billing");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          user={{
            name: session.user.name ?? "",
            email: session.user.email ?? "",
            role: session.user.role,
            isPlatformAdmin: session.user.isPlatformAdmin,
          }}
        />
        {subscription?.status === "PAST_DUE" && (
          <a
            href="/billing"
            className="flex items-center justify-center bg-amber px-4 py-2 text-sm font-medium text-ink hover:bg-amber-dark"
          >
            An invoice is due — pay now to avoid your workspace being suspended →
          </a>
        )}
        <main className="flex-1 bg-canvas px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
