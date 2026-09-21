import { db } from "@/db";
import { contentItems, contentApprovalEvents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notifyApprovers } from "@/lib/notifications";
import type { ContentItem } from "@/db/schema";

/** Shared by the manual "Submit for approval" button
 * (api/content/[id]/submit) and the pipeline's optional auto-submit step
 * — one place for the state transition + event log + notification, so
 * both callers can't drift out of sync. */
export async function submitForApproval(
  item: ContentItem,
  actorId: string,
  actorName: string
): Promise<ContentItem> {
  const [updated] = await db
    .update(contentItems)
    .set({ status: "PENDING_APPROVAL", updatedAt: new Date() })
    .where(eq(contentItems.id, item.id))
    .returning();

  await db.insert(contentApprovalEvents).values({
    contentItemId: item.id,
    action: "SUBMITTED",
    actorId,
  });

  await notifyApprovers({
    agencyId: item.agencyId,
    excludeUserId: actorId,
    title: `"${item.title}" submitted for review`,
    body: `${actorName} submitted this for approval.`,
    link: "/approvals",
  });

  return updated;
}
