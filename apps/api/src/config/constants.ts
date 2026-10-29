export const CATEGORIES = [
  "Electronics",
  "ID Cards",
  "Books and Notes",
  "Bags",
  "Keys",
  "Clothing",
  "Accessories",
  "Water Bottles",
  "Other",
] as const;

export const ITEM_TYPES = ["lost", "found"] as const;
export const ITEM_STATUSES = ["pending", "approved", "rejected", "resolved", "archived"] as const;
export const CLAIM_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export const ROLES = ["student", "admin"] as const;
export const ACCOUNT_STATUSES = ["active", "suspended"] as const;
export const CONTACT_PREFERENCES = ["in_app", "email"] as const;

export type Category = (typeof CATEGORIES)[number];
export type ItemType = (typeof ITEM_TYPES)[number];
export type ItemStatus = (typeof ITEM_STATUSES)[number];
export type ClaimStatus = (typeof CLAIM_STATUSES)[number];
export type Role = (typeof ROLES)[number];
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];
export type ContactPreference = (typeof CONTACT_PREFERENCES)[number];

export const PUBLIC_ITEM_STATUSES: ItemStatus[] = ["approved"];
