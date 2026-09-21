import { randomUUID, randomBytes } from "node:crypto";

/** Generates a unique id for new rows. Swap this out if you later want
 * shorter/prefixed ids (e.g. "brand_xxx") — every table calls this one
 * helper so the format only needs to change in one place. */
export function createId(): string {
  return randomUUID();
}

/** Short, shareable code for inviting teammates into an agency. */
export function createInviteCode(): string {
  return randomBytes(5).toString("hex");
}
