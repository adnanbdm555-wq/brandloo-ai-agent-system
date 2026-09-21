import { db } from "@/db";
import { invoices } from "@/db/schema";
import { sql } from "drizzle-orm";

/** INV-000001, INV-000002, ... — sequential, generated from a count so it
 * stays human-readable on real invoices. Fine at this scale; swap for a
 * dedicated sequence table if you outgrow a simple count. */
export async function nextInvoiceNumber(): Promise<string> {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(invoices);
  return `INV-${String(count + 1).padStart(6, "0")}`;
}
