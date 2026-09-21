import { Safepay } from "@sfpy/node-sdk";
import type { SafepayOptions } from "@sfpy/node-sdk/dist/types";

/** Thrown when Safepay isn't configured — routes catch this and return a
 * clear 503 rather than crashing, same pattern as AgentConfigError and
 * EmailConfigError elsewhere in this codebase. */
export class PaymentConfigError extends Error {}

let client: Safepay | null = null;

function getSafepayClient(): Safepay {
  const apiKey = process.env.SAFEPAY_API_KEY;
  const v1Secret = process.env.SAFEPAY_V1_SECRET;
  const webhookSecret = process.env.SAFEPAY_WEBHOOK_SECRET;
  if (!apiKey || !v1Secret || !webhookSecret) {
    throw new PaymentConfigError(
      "Safepay is not configured. Add SAFEPAY_API_KEY, SAFEPAY_V1_SECRET, and SAFEPAY_WEBHOOK_SECRET to your environment."
    );
  }
  if (!client) {
    client = new Safepay({
      environment: (process.env.SAFEPAY_ENVIRONMENT === "production"
        ? "production"
        : "sandbox") as SafepayOptions["environment"],
      apiKey,
      v1Secret,
      webhookSecret,
    });
  }
  return client;
}

/**
 * Creates a Safepay checkout link for one invoice. The invoice number is
 * passed as Safepay's `orderId` — that's how the webhook below finds its
 * way back to the right invoice.
 *
 * IMPORTANT: this is written against the current published `@sfpy/node-sdk`
 * shape (github.com/getsafepay/safepay-node) as of when this was built.
 * Payment gateway APIs shift — this has not been run against a real
 * Safepay sandbox (no account existed to test with). Before going live,
 * run one real test invoice through Safepay's sandbox and confirm the
 * `payments.create` / `checkout.create` calls below still match their
 * current docs (https://safepay-docs.netlify.app).
 */
export async function createCheckoutSession(params: {
  invoiceNumber: string;
  amountPkr: number;
}): Promise<string> {
  const safepay = getSafepayClient();
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const { token } = await safepay.payments.create({
    amount: params.amountPkr,
    currency: "PKR",
  });

  const url = safepay.checkout.create({
    token,
    orderId: params.invoiceNumber,
    cancelUrl: `${appUrl}/billing?payment=cancelled`,
    redirectUrl: `${appUrl}/billing?payment=success`,
    source: "custom",
    webhooks: true,
  });

  return url;
}

/**
 * Verifies a Safepay webhook request and extracts which invoice it's for.
 * Returns null if the signature doesn't verify. The exact shape of the
 * verified payload (where the orderId/amount live) should be confirmed
 * against a real webhook delivery in Safepay's sandbox — see the note
 * above. `orderId` here is expected to be the invoiceNumber passed into
 * createCheckoutSession above.
 */
export async function verifyAndParseWebhook(
  req: Request
): Promise<{ orderId: string; paymentRef: string } | null> {
  const safepay = getSafepayClient();
  const valid = await safepay.verify.webhook(req as unknown as never);
  if (!valid) return null;

  // Defensive parse — adjust field names once verified against a real
  // Safepay webhook payload.
  const body = await req.clone().json().catch(() => null);
  const orderId: string | undefined =
    body?.data?.order_id ?? body?.orderId ?? body?.order_id;
  const paymentRef: string | undefined =
    body?.data?.tracker_token ?? body?.data?.id ?? body?.id;

  if (!orderId) return null;
  return { orderId, paymentRef: paymentRef ?? "unknown" };
}
