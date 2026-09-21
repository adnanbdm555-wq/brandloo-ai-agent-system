import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";

// Deliberately NOT under (dashboard), same reasoning as app/billing —
// a platform admin must be able to reach this even if their OWN agency
// happens to be suspended (e.g. while testing, or simply because they
// use the platform themselves). Platform-admin access is checked in the
// page itself; this layout only checks that someone is logged in.
export default async function PlatformAdminLayout({
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
