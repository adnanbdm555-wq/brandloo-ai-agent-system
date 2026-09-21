function wrapper(bodyHtml: string): string {
  return `
  <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
    <p style="font-size: 13px; color: #8A8778; letter-spacing: 0.02em; text-transform: uppercase; margin: 0 0 16px;">Brandloop</p>
    ${bodyHtml}
    <p style="font-size: 12px; color: #8A8778; margin-top: 32px;">
      This is an automated billing notice from your Brandloop workspace.
    </p>
  </div>`;
}

export function trialEndingSoonEmail(params: { agencyName: string; daysLeft: number; billingUrl: string }) {
  return {
    subject: `Your ${params.agencyName} trial ends in ${params.daysLeft} day${params.daysLeft === 1 ? "" : "s"}`,
    html: wrapper(`
      <h1 style="font-size: 20px; color: #14161C; margin: 0 0 12px;">Your trial is ending soon</h1>
      <p style="font-size: 14px; color: #14161C; line-height: 1.6;">
        Your ${params.agencyName} trial ends in <strong>${params.daysLeft} day${params.daysLeft === 1 ? "" : "s"}</strong>.
        To keep using the platform without interruption, add a payment method before then.
      </p>
      <a href="${params.billingUrl}" style="display:inline-block; margin-top:16px; background:#3552E0; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-size:14px;">
        Go to Billing
      </a>
    `),
  };
}

export function trialEndedInvoiceEmail(params: {
  agencyName: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  dueDate: string;
  billingUrl: string;
}) {
  return {
    subject: `Invoice ${params.invoiceNumber} for ${params.agencyName}`,
    html: wrapper(`
      <h1 style="font-size: 20px; color: #14161C; margin: 0 0 12px;">Your trial has ended</h1>
      <p style="font-size: 14px; color: #14161C; line-height: 1.6;">
        Invoice <strong>${params.invoiceNumber}</strong> for
        <strong>${params.amount.toLocaleString()} ${params.currency}</strong> is ready.
        Complete payment by ${params.dueDate} to keep your workspace active.
      </p>
      <a href="${params.billingUrl}" style="display:inline-block; margin-top:16px; background:#3552E0; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-size:14px;">
        Pay Invoice
      </a>
    `),
  };
}

export function accountSuspendedEmail(params: { agencyName: string; billingUrl: string }) {
  return {
    subject: `${params.agencyName} workspace suspended — action needed`,
    html: wrapper(`
      <h1 style="font-size: 20px; color: #14161C; margin: 0 0 12px;">Your workspace has been suspended</h1>
      <p style="font-size: 14px; color: #14161C; line-height: 1.6;">
        Payment wasn't received for ${params.agencyName}, so access has been paused.
        Pay the outstanding invoice to restore access immediately.
      </p>
      <a href="${params.billingUrl}" style="display:inline-block; margin-top:16px; background:#3552E0; color:#fff; padding:10px 20px; border-radius:8px; text-decoration:none; font-size:14px;">
        Pay & Restore Access
      </a>
    `),
  };
}

export function paymentConfirmedEmail(params: { agencyName: string; invoiceNumber: string }) {
  return {
    subject: `Payment received — ${params.agencyName} is active`,
    html: wrapper(`
      <h1 style="font-size: 20px; color: #14161C; margin: 0 0 12px;">Payment received</h1>
      <p style="font-size: 14px; color: #14161C; line-height: 1.6;">
        Thanks — invoice <strong>${params.invoiceNumber}</strong> is paid and your workspace is active.
      </p>
    `),
  };
}
