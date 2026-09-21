import { Resend } from "resend";

/** Thrown when email can't be sent because config is missing — callers
 * catch this and degrade gracefully (skip the send, log it, keep going)
 * rather than crashing a billing run over a missing email key. */
export class EmailConfigError extends Error {}

let client: Resend | null = null;

function getResendClient(): Resend {
  if (!process.env.RESEND_API_KEY) {
    throw new EmailConfigError(
      "RESEND_API_KEY is not set. Add it to your environment to enable billing emails."
    );
  }
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY);
  }
  return client;
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ sent: boolean; error?: string }> {
  try {
    const resend = getResendClient();
    const from = process.env.BILLING_EMAIL_FROM || "billing@yourdomain.com";
    await resend.emails.send({
      from,
      to: params.to,
      subject: params.subject,
      html: params.html,
    });
    return { sent: true };
  } catch (err) {
    if (err instanceof EmailConfigError) {
      return { sent: false, error: err.message };
    }
    console.error("Email send error:", err);
    return { sent: false, error: "Failed to send email" };
  }
}
