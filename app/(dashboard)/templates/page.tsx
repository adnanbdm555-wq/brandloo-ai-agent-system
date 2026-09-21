import { auth } from "@/auth";
import { db } from "@/db";
import { brands, contentTemplates } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Templates } from "@/components/Templates";
import { canEdit } from "@/lib/roles";

export default async function TemplatesPage() {
  const session = await auth();
  const agencyId = session!.user.agencyId;
  const [allBrands, allTemplates] = await Promise.all([
    db.select().from(brands).where(eq(brands.agencyId, agencyId)).orderBy(desc(brands.createdAt)),
    db
      .select()
      .from(contentTemplates)
      .where(eq(contentTemplates.agencyId, agencyId))
      .orderBy(desc(contentTemplates.createdAt)),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl text-ink">Templates</h1>
      <p className="mt-1 text-sm text-muted">
        Reusable briefs for the Content Agent — save one once, use it from
        Content Studio anytime.
      </p>
      <div className="mt-6">
        <Templates
          brands={allBrands}
          initialTemplates={allTemplates}
          canEdit={canEdit(session?.user.role)}
        />
      </div>
    </div>
  );
}
