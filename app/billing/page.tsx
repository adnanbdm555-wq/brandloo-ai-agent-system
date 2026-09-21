import { auth } from "@/auth";
import { BillingView } from "@/components/BillingView";
import { canManageUsers } from "@/lib/roles";

export default async function BillingPage() {
  const session = await auth();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl text-ink">Billing</h1>
      <p className="mt-1 text-sm text-muted">
        Your plan, trial status, and invoices.
      </p>
      <div className="mt-6">
        <BillingView canPay={canManageUsers(session?.user.role)} />
      </div>
    </div>
  );
}
