import { auth } from "@/auth";
import { db } from "@/db";
import { brands, contentItems } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { ApprovalCenter } from "@/components/ApprovalCenter";
import { canApprove } from "@/lib/roles";

export default async function ApprovalsPage() {
  const session = await auth();
  const agencyId = session!.user.agencyId;
  const [allBrands, pendingItems] = await Promise.all([
    db.select().from(brands).where(eq(brands.agencyId, agencyId)).orderBy(desc(brands.createdAt)),
    db
      .select()
      .from(contentItems)
      .where(and(eq(contentItems.status, "PENDING_APPROVAL"), eq(contentItems.agencyId, agencyId)))
      .orderBy(desc(contentItems.updatedAt)),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-2xl text-ink">Approval Center</h1>
      <p className="mt-1 text-sm text-muted">
        Content submitted for review, with its QA report alongside.
      </p>
      <div className="mt-6">
        <ApprovalCenter
          brands={allBrands}
          initialItems={pendingItems}
          canApproveContent={canApprove(session?.user.role)}
        />
      </div>
    </div>
  );
}
