import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { canApprove, type AppRole } from "@/lib/roles";

/** Notifies every approver in the given agency except the person who
 * triggered the event (no need to tell someone about their own action).
 * Used when content is submitted for review. Scoped to agencyId — never
 * queries across tenants. */
export async function notifyApprovers(params: {
  agencyId: string;
  excludeUserId: string;
  title: string;
  body: string;
  link: string;
}) {
  const agencyUsers = await db
    .select()
    .from(users)
    .where(eq(users.agencyId, params.agencyId));
  const approvers = agencyUsers.filter(
    (u) => u.id !== params.excludeUserId && canApprove(u.role as AppRole)
  );
  if (approvers.length === 0) return;

  await db.insert(notifications).values(
    approvers.map((u) => ({
      userId: u.id,
      type: "CONTENT_SUBMITTED" as const,
      title: params.title,
      body: params.body,
      link: params.link,
    }))
  );
}

/** Notifies one specific user — used to tell a content creator their
 * submission was approved or rejected. */
export async function notifyUser(params: {
  userId: string;
  type: "CONTENT_APPROVED" | "CONTENT_REJECTED";
  title: string;
  body: string;
  link: string;
}) {
  await db.insert(notifications).values({
    userId: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    link: params.link,
  });
}
