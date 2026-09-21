import { auth } from "@/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NotificationsList } from "@/components/NotificationsList";

export default async function NotificationsPage() {
  const session = await auth();
  const items = session?.user
    ? await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, session.user.id))
        .orderBy(desc(notifications.createdAt))
        .limit(100)
    : [];

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl text-ink">Notifications</h1>
      <p className="mt-1 text-sm text-muted">
        Approvals, reviews, and anything else that needs your attention.
      </p>
      <div className="mt-6">
        <NotificationsList initialItems={items} />
      </div>
    </div>
  );
}
