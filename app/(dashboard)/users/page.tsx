import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { users, agencies } from "@/db/schema";
import { eq } from "drizzle-orm";
import { canManageUsers } from "@/lib/roles";
import { UsersRoles } from "@/components/UsersRoles";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user || !canManageUsers(session.user.role)) {
    redirect("/dashboard");
  }

  const [agency, members] = await Promise.all([
    db.select().from(agencies).where(eq(agencies.id, session.user.agencyId)).limit(1),
    db
      .select({ id: users.id, name: users.name, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.agencyId, session.user.agencyId)),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl text-ink">Users &amp; Roles</h1>
      <p className="mt-1 text-sm text-muted">
        Manage who's in your agency and what they can do.
      </p>
      <div className="mt-6">
        <UsersRoles
          currentUserId={session.user.id}
          initialMembers={members}
          agencyName={agency[0]?.name ?? ""}
          inviteCode={agency[0]?.inviteCode ?? ""}
        />
      </div>
    </div>
  );
}
