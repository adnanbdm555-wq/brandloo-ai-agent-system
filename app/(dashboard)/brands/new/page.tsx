import { BrandForm } from "@/components/BrandForm";

export default function NewBrandPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl text-ink">Add a brand</h1>
      <p className="mt-1 text-sm text-muted">
        This becomes the knowledge every AI agent uses for this brand — the
        more complete it is, the better generated content will be.
      </p>
      <div className="mt-6">
        <BrandForm />
      </div>
    </div>
  );
}
