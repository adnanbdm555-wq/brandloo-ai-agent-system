import { auth } from "@/auth";
import { db } from "@/db";
import { brands, contentItems } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { CreativeStudio } from "@/components/CreativeStudio";

export default async function CreativeStudioPage({
  searchParams,
}: {
  searchParams: Promise<{ contentId?: string }>;
}) {
  const { contentId } = await searchParams;
  const session = await auth();
  const agencyId = session!.user.agencyId;
  const [allBrands, allContent] = await Promise.all([
    db.select().from(brands).where(eq(brands.agencyId, agencyId)).orderBy(desc(brands.createdAt)),
    db.select().from(contentItems).where(eq(contentItems.agencyId, agencyId)).orderBy(desc(contentItems.createdAt)),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="font-display text-2xl text-ink">Creative Studio</h1>
      <p className="mt-1 text-sm text-muted">
        The Creative Agent writes a brief a designer can execute — colors
        and direction come from the brand's visual identity.
      </p>
      <div className="mt-6">
        <CreativeStudio brands={allBrands} contentItems={allContent} defaultContentId={contentId} />
      </div>
    </div>
  );
}
