import type { ItemRecord } from "../repositories/item.repository.js";
import type { UserRecord } from "../repositories/user.repository.js";
import type { ClaimRecord } from "../repositories/claim.repository.js";
import type { ActivityRecord } from "../repositories/activity.repository.js";
import type { Role } from "../config/constants.js";
import { getEnv } from "../config/env.js";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  studentId: string;
  role: Role;
  accountStatus: string;
  createdAt: string;
};

export function toPublicUser(user: UserRecord): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    studentId: user.studentId,
    role: user.role,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt.toISOString(),
  };
}

type Viewer = { id: string; role: Role } | null;

export type ItemView = {
  id: string;
  title: string;
  description: string;
  type: ItemRecord["type"];
  category: ItemRecord["category"];
  location: string;
  eventDate: string;
  status: ItemRecord["status"];
  imageUrl: string | null;
  contactPreference: ItemRecord["contactPreference"];
  createdAt: string;
  updatedAt: string;
  reporterId?: string;
  identifyingDetails?: string;
  notes?: string;
  moderation?: ItemRecord["moderation"];
  resolution?: ItemRecord["resolution"];
};

export function canSeePrivateItem(item: ItemRecord, viewer: Viewer): boolean {
  if (!viewer) return false;
  return viewer.role === "admin" || viewer.id === item.reporterId;
}

export function toItemView(item: ItemRecord, viewer: Viewer): ItemView {
  const prefix = getEnv().PUBLIC_API_PREFIX.replace(/\/$/, "");
  const view: ItemView = {
    id: item.id,
    title: item.title,
    description: item.description,
    type: item.type,
    category: item.category,
    location: item.location,
    eventDate: item.eventDate.toISOString(),
    status: item.status,
    imageUrl: item.imageFilename ? `${prefix}/uploads/${item.imageFilename}` : null,
    contactPreference: item.contactPreference,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
  if (canSeePrivateItem(item, viewer)) {
    view.reporterId = item.reporterId;
    view.identifyingDetails = item.identifyingDetails;
    view.notes = item.notes;
    view.moderation = {
      reviewedBy: item.moderation.reviewedBy,
      reviewedAt: item.moderation.reviewedAt,
      note: item.moderation.note,
    };
    view.resolution = item.resolution;
  }
  return view;
}

export type ClaimView = {
  id: string;
  itemId: string;
  status: ClaimRecord["status"];
  explanation: string;
  createdAt: string;
  updatedAt: string;
  reviewNote?: string;
  reviewedAt?: string | null;
  claimantId?: string;
  proofDescription?: string;
  itemTitle?: string;
};

export function toClaimView(
  claim: ClaimRecord,
  viewer: { id: string; role: Role },
  item: ItemRecord | null,
): ClaimView {
  const isClaimant = viewer.id === claim.claimantId;
  const isOwner = item ? item.reporterId === viewer.id : false;
  const isAdmin = viewer.role === "admin";
  const view: ClaimView = {
    id: claim.id,
    itemId: claim.itemId,
    status: claim.status,
    explanation: claim.explanation,
    createdAt: claim.createdAt.toISOString(),
    updatedAt: claim.updatedAt.toISOString(),
    itemTitle: item?.title,
  };
  if (isClaimant || isOwner || isAdmin) {
    view.reviewNote = claim.reviewNote;
    view.reviewedAt = claim.reviewedAt ? claim.reviewedAt.toISOString() : null;
  }
  if (isOwner || isAdmin) {
    view.claimantId = claim.claimantId;
    view.proofDescription = claim.proofDescription;
  }
  return view;
}

export function toActivityView(activity: ActivityRecord) {
  return {
    id: activity.id,
    actorId: activity.actorId,
    action: activity.action,
    resourceType: activity.resourceType,
    resourceId: activity.resourceId,
    metadata: activity.metadata,
    createdAt: activity.createdAt.toISOString(),
  };
}
