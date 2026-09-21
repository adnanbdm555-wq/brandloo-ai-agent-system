import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

// Deliberately NOT under (dashboard) — this page must stay reachable even
// when an agency's subscription is SUSPENDED, since it's how they pay to
// get unsuspended. The (dashboard) layout redirects here when suspended;
// this layout only checks that someone is logged in at all.
export default async function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
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
        <main className="flex-1 bg-canvas px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
