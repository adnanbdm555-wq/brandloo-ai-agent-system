import { Suspense } from "react";
import { auth } from "@/auth";
import { db } from "@/db";
import { brands, contentItems } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { ContentCalendar } from "@/components/ContentCalendar";
import { canEdit, canApprove } from "@/lib/roles";

export default async function ContentCalendarPage() {
  const session = await auth();
  const agencyId = session!.user.agencyId;
  const [allBrands, allItems] = await Promise.all([
    db.select().from(brands).where(eq(brands.agencyId, agencyId)).orderBy(desc(brands.createdAt)),
    db.select().from(contentItems).where(eq(contentItems.agencyId, agencyId)).orderBy(desc(contentItems.createdAt)),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl text-ink">Content Calendar</h1>
      <p className="mt-1 text-sm text-muted">
        Drag a draft onto a date to schedule it, or click any post to edit it.
      </p>
      <div className="mt-6">
        <Suspense fallback={null}>
          <ContentCalendar
            brands={allBrands}
            initialItems={allItems}
            canEditContent={canEdit(session?.user.role)}
            canApproveContent={canApprove(session?.user.role)}
          />
        </Suspense>
      </div>
    </div>
  );
}
