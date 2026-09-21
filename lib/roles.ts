export const ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MARKETING_MANAGER",
  "CONTENT_MANAGER",
  "DESIGNER",
  "CLIENT",
  "VIEWER",
] as const;

export type AppRole = (typeof ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MARKETING_MANAGER: "Marketing Manager",
  CONTENT_MANAGER: "Content Manager",
  DESIGNER: "Designer",
  CLIENT: "Client",
  VIEWER: "Viewer",
};

// Phase 1 keeps this simple: anyone signed in can view; only these roles
// can create/edit/delete brands and knowledge. Fuller per-module permission
// rules land with Users & Roles in a later phase.
const EDITOR_ROLES: AppRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "MARKETING_MANAGER",
  "CONTENT_MANAGER",
  "DESIGNER",
];

export function canEdit(role: string | undefined | null): boolean {
  return !!role && EDITOR_ROLES.includes(role as AppRole);
}

// Phase 3: approving/rejecting content is a narrower set than editing it —
// content creators (Content Manager, Designer) can submit for review, but
// shouldn't be the ones signing off on their own work.
const APPROVER_ROLES: AppRole[] = ["SUPER_ADMIN", "ADMIN", "MARKETING_MANAGER"];

export function canApprove(role: string | undefined | null): boolean {
  return !!role && APPROVER_ROLES.includes(role as AppRole);
}

// Phase 6: managing teammates (roles, removal, seeing the invite code) is
// narrower still — deliberately not given to Marketing Manager, even
// though that role can approve content.
const USER_MANAGER_ROLES: AppRole[] = ["SUPER_ADMIN", "ADMIN"];

export function canManageUsers(role: string | undefined | null): boolean {
  return !!role && USER_MANAGER_ROLES.includes(role as AppRole);
}
