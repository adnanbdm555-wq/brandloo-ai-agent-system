import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { BrandForm } from "@/components/BrandForm";

export default async function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const [brand] = await db
    .select()
    .from(brands)
    .where(and(eq(brands.id, id), eq(brands.agencyId, session!.user.agencyId)))
    .limit(1);
  if (!brand) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl text-ink">Edit {brand.name}</h1>
      <p className="mt-1 text-sm text-muted">
        Changes apply the next time an agent generates content for this brand.
      </p>
      <div className="mt-6">
        <BrandForm brand={brand} />
      </div>
    </div>
  );
}
