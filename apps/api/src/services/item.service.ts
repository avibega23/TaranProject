import type { FilterQuery } from "mongoose";
import { ItemModel } from "../models/item.model.js";
import { ItemRepository, type ItemRecord } from "../repositories/item.repository.js";
import { ActivityRepository } from "../repositories/activity.repository.js";
import { AppError } from "../utils/errors.js";
import { buildSearchText, escapeRegex, tokenize } from "../utils/text.js";
import type { Category, ItemStatus, ItemType, Role } from "../config/constants.js";
import { toPagination } from "../utils/pagination.js";

const items = new ItemRepository();
const activity = new ActivityRepository();

export type ItemInput = {
  title: string;
  description: string;
  type: ItemType;
  category: Category;
  location: string;
  eventDate: Date;
  identifyingDetails?: string;
  contactPreference: "in_app" | "email";
  notes?: string;
  imageFilename?: string | null;
};

export type ItemQuery = {
  q?: string;
  type?: ItemType;
  category?: Category;
  location?: string;
  from?: Date;
  to?: Date;
  status?: ItemStatus;
  page: number;
  limit: number;
};

const ACTIVE_EDIT: ItemStatus[] = ["pending", "approved"];

export async function createItem(reporterId: string, input: ItemInput): Promise<ItemRecord> {
  const item = await items.create({
    title: input.title.trim(),
    description: input.description.trim(),
    searchText: buildSearchText([input.title, input.description, input.location, input.category]),
    type: input.type,
    category: input.category,
    location: input.location.trim(),
    eventDate: input.eventDate,
    imageFilename: input.imageFilename ?? null,
    identifyingDetails: input.identifyingDetails?.trim() ?? "",
    contactPreference: input.contactPreference,
    notes: input.notes?.trim() ?? "",
    reporterId,
    status: "pending",
  });
  await activity.create({
    actorId: reporterId,
    action: "item.created",
    resourceType: "item",
    resourceId: item.id,
    metadata: { type: item.type, category: item.category, title: item.title },
  });
  return item;
}

export async function getItemForViewer(
  id: string,
  viewer: { id: string; role: Role } | null,
): Promise<ItemRecord> {
  const item = await items.findById(id);
  if (!item || item.status === "archived") {
    throw new AppError(404, "NOT_FOUND", "Item not found.");
  }
  const isOwner = viewer?.id === item.reporterId;
  const isAdmin = viewer?.role === "admin";
  if (item.status !== "approved" && item.status !== "resolved" && !isOwner && !isAdmin) {
    throw new AppError(404, "NOT_FOUND", "Item not found.");
  }
  if (item.status === "rejected" && !isOwner && !isAdmin) {
    throw new AppError(404, "NOT_FOUND", "Item not found.");
  }
  return item;
}

export async function searchPublicItems(query: ItemQuery) {
  const filter = buildFilter({ ...query, status: "approved" });
  const result = await items.search(filter, query.page, query.limit);
  return { items: result.items, pagination: toPagination(query.page, query.limit, result.total) };
}

export async function searchManageableItems(
  query: ItemQuery & { reporterId?: string },
) {
  const filter = buildFilter(query);
  if (query.reporterId) filter.reporter = query.reporterId;
  const result = await items.search(filter, query.page, query.limit);
  return { items: result.items, pagination: toPagination(query.page, query.limit, result.total) };
}

export async function updateOwnItem(
  id: string,
  actor: { id: string; role: Role },
  input: Partial<ItemInput>,
): Promise<ItemRecord> {
  const item = await items.findById(id);
  if (!item || item.status === "archived") throw new AppError(404, "NOT_FOUND", "Item not found.");
  if (actor.role !== "admin" && item.reporterId !== actor.id) {
    throw new AppError(403, "FORBIDDEN", "You can only edit your own reports.");
  }
  if (!ACTIVE_EDIT.includes(item.status) && actor.role !== "admin") {
    throw new AppError(409, "CONFLICT", "This report can no longer be edited.");
  }
  const title = input.title?.trim() ?? item.title;
  const description = input.description?.trim() ?? item.description;
  const location = input.location?.trim() ?? item.location;
  const category = input.category ?? item.category;
  const updated = await items.updateById(id, {
    title,
    description,
    location,
    category,
    type: input.type ?? item.type,
    eventDate: input.eventDate ?? item.eventDate,
    identifyingDetails: input.identifyingDetails?.trim() ?? item.identifyingDetails,
    contactPreference: input.contactPreference ?? item.contactPreference,
    notes: input.notes?.trim() ?? item.notes,
    imageFilename: input.imageFilename === undefined ? item.imageFilename : input.imageFilename,
    searchText: buildSearchText([title, description, location, category]),
  });
  if (!updated) throw new AppError(404, "NOT_FOUND", "Item not found.");
  await activity.create({
    actorId: actor.id,
    action: "item.updated",
    resourceType: "item",
    resourceId: id,
    metadata: { title: updated.title },
  });
  return updated;
}

export async function archiveItem(id: string, actor: { id: string; role: Role }): Promise<ItemRecord> {
  const item = await items.findById(id);
  if (!item || item.status === "archived") throw new AppError(404, "NOT_FOUND", "Item not found.");
  if (actor.role !== "admin" && item.reporterId !== actor.id) {
    throw new AppError(403, "FORBIDDEN", "You can only remove your own reports.");
  }
  const updated = await items.updateById(id, { status: "archived" });
  if (!updated) throw new AppError(404, "NOT_FOUND", "Item not found.");
  await activity.create({
    actorId: actor.id,
    action: "item.archived",
    resourceType: "item",
    resourceId: id,
    metadata: { title: item.title },
  });
  return updated;
}

export async function moderateItem(
  id: string,
  adminId: string,
  action: "approve" | "reject" | "archive" | "resolve",
  note?: string,
): Promise<ItemRecord> {
  const item = await items.findById(id);
  if (!item) throw new AppError(404, "NOT_FOUND", "Item not found.");
  if (item.status === "archived") {
    throw new AppError(409, "CONFLICT", "Archived reports cannot be moderated.");
  }

  const now = new Date();
  const moderation = { reviewedBy: adminId, reviewedAt: now, note: note?.trim() ?? "" };
  let update: Record<string, unknown> = { moderation };

  if (action === "approve") {
    if (item.status !== "pending" && item.status !== "rejected") {
      throw new AppError(409, "CONFLICT", "Only pending or rejected reports can be approved.");
    }
    update = { ...update, status: "approved" };
  } else if (action === "reject") {
    if (item.status !== "pending" && item.status !== "approved") {
      throw new AppError(409, "CONFLICT", "Only pending or approved reports can be rejected.");
    }
    update = { ...update, status: "rejected" };
  } else if (action === "archive") {
    update = { ...update, status: "archived" };
  } else if (action === "resolve") {
    if (item.status !== "approved") {
      throw new AppError(409, "CONFLICT", "Only an approved report can be marked resolved.");
    }
    update = {
      ...update,
      status: "resolved",
      resolution: { resolvedBy: adminId, resolvedAt: now, claim: item.resolution.claimId },
    };
  }

  const updated = await items.updateById(id, update);
  if (!updated) throw new AppError(404, "NOT_FOUND", "Item not found.");
  await activity.create({
    actorId: adminId,
    action: action === "resolve" ? "item.resolved" : "item.moderated",
    resourceType: "item",
    resourceId: id,
    metadata: { decision: action, title: item.title },
  });
  return updated;
}

export async function publicStats() {
  const [lost, found, resolved] = await Promise.all([
    items.count({ type: "lost", status: "approved" }),
    items.count({ type: "found", status: "approved" }),
    items.count({ status: "resolved" }),
  ]);
  return { lost, found, resolved };
}

export function buildFilter(query: Partial<ItemQuery> & { reporterId?: string }): FilterQuery<typeof ItemModel> {
  const filter: FilterQuery<typeof ItemModel> = {};
  if (query.status) filter.status = query.status;
  if (query.type) filter.type = query.type;
  if (query.category) filter.category = query.category;
  if (query.location) {
    filter.location = { $regex: escapeRegex(query.location.trim()), $options: "i" };
  }
  if (query.from || query.to) {
    filter.eventDate = {};
    if (query.from) filter.eventDate.$gte = query.from;
    if (query.to) filter.eventDate.$lte = query.to;
  }
  const tokens = query.q ? tokenize(query.q) : [];
  if (tokens.length > 0) {
    filter.$and = tokens.map((token) => ({
      searchText: { $regex: escapeRegex(token), $options: "i" },
    }));
  }
  return filter;
}

export { items as itemRepository };
