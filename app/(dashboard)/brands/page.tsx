import Link from "next/link";
import { auth } from "@/auth";
import { db } from "@/db";
import { brands } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { Plus, Building2, Globe, ArrowUpRight } from "lucide-react";

export default async function BrandsPage() {
  const session = await auth();
  const allBrands = await db
    .select()
    .from(brands)
    .where(eq(brands.agencyId, session!.user.agencyId))
    .orderBy(desc(brands.createdAt));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-ink">Brands</h1>
          <p className="mt-1 text-sm text-muted">
            Every brand your agency manages, with its own knowledge base.
          </p>
        </div>
        <Link
          href="/brands/new"
          className="flex items-center gap-1.5 rounded-lg bg-indigo px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-dark"
        >
          <Plus className="h-4 w-4" />
          Add brand
        </Link>
      </div>

      {allBrands.length === 0 ? (
        <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-border bg-surface py-16 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-light text-indigo">
            <Building2 className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm font-medium text-ink">No brands yet</p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            Every AI agent works from a brand's knowledge base — add your
            first brand to get started.
          </p>
          <Link
            href="/brands/new"
            className="mt-5 rounded-lg bg-indigo px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-dark"
          >
            Add your first brand
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allBrands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.id}`}
              className="group rounded-xl border border-border bg-surface p-5 shadow-card transition hover:border-indigo/40"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-light text-sm font-semibold text-indigo">
                  {brand.name.slice(0, 2).toUpperCase()}
                </div>
                <ArrowUpRight className="h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100" />
              </div>
              <h3 className="mt-3 font-display text-lg text-ink">{brand.name}</h3>
              <p className="text-sm text-muted">
                {brand.industry || "No industry set"}
              </p>
              {brand.website && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
                  <Globe className="h-3.5 w-3.5" />
                  {brand.website}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
