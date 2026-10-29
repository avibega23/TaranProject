import mongoose from "mongoose";
import { ClaimRepository, type ClaimRecord } from "../repositories/claim.repository.js";
import { ItemRepository, type ItemRecord } from "../repositories/item.repository.js";
import { ActivityRepository } from "../repositories/activity.repository.js";
import { ClaimModel } from "../models/claim.model.js";
import { ItemModel } from "../models/item.model.js";
import { AppError } from "../utils/errors.js";
import { toPagination } from "../utils/pagination.js";
import type { Role } from "../config/constants.js";
import { logError } from "../utils/logger.js";

const claims = new ClaimRepository();
const items = new ItemRepository();
const activity = new ActivityRepository();

export async function createClaim(
  itemId: string,
  claimantId: string,
  input: { explanation: string; proofDescription?: string },
): Promise<ClaimRecord> {
  const item = await items.findById(itemId);
  assertClaimable(item, claimantId);
  const existing = await claims.findPending(itemId, claimantId);
  if (existing) {
    throw new AppError(409, "CONFLICT", "You already have an active claim for this item.");
  }
  try {
    const claim = await claims.create({
      itemId,
      claimantId,
      explanation: input.explanation.trim(),
      proofDescription: input.proofDescription?.trim() ?? "",
    });
    await activity.create({
      actorId: claimantId,
      action: "claim.created",
      resourceType: "claim",
      resourceId: claim.id,
      metadata: { itemId, status: "pending" },
    });
    return claim;
  } catch (error) {
    if (isDuplicateKey(error)) {
      throw new AppError(409, "CONFLICT", "You already have an active claim for this item.");
    }
    throw error;
  }
}

export async function cancelClaim(claimId: string, userId: string): Promise<ClaimRecord> {
  const claim = await claims.findById(claimId);
  if (!claim) throw new AppError(404, "NOT_FOUND", "Claim not found.");
  if (claim.claimantId !== userId) {
    throw new AppError(403, "FORBIDDEN", "You can only cancel your own claims.");
  }
  if (claim.status !== "pending") {
    throw new AppError(409, "CONFLICT", "Only a pending claim can be cancelled.");
  }
  const updated = await claims.updateById(claimId, { status: "cancelled" });
  if (!updated) throw new AppError(404, "NOT_FOUND", "Claim not found.");
  await activity.create({
    actorId: userId,
    action: "claim.cancelled",
    resourceType: "claim",
    resourceId: claimId,
    metadata: { itemId: claim.itemId, status: "cancelled" },
  });
  return updated;
}

export async function reviewClaim(
  claimId: string,
  actor: { id: string; role: Role },
  decision: "approve" | "reject",
  note?: string,
): Promise<ClaimRecord> {
  const claim = await claims.findById(claimId);
  if (!claim) throw new AppError(404, "NOT_FOUND", "Claim not found.");
  if (claim.status !== "pending") {
    throw new AppError(409, "CONFLICT", "This claim has already been reviewed.");
  }
  if (claim.claimantId === actor.id) {
    throw new AppError(403, "FORBIDDEN", "You cannot review your own claim.");
  }
  const item = await items.findById(claim.itemId);
  if (!item) throw new AppError(404, "NOT_FOUND", "The reported item no longer exists.");
  const isOwner = item.reporterId === actor.id;
  if (actor.role !== "admin" && !isOwner) {
    throw new AppError(403, "FORBIDDEN", "Only an administrator or the reporter can review this claim.");
  }
  if (item.status !== "approved") {
    throw new AppError(409, "CONFLICT", "Claims can only be reviewed while the report is approved.");
  }

  if (decision === "reject") {
    const updated = await claims.updateById(claimId, {
      status: "rejected",
      reviewedBy: actor.id,
      reviewedAt: new Date(),
      reviewNote: note?.trim() ?? "",
    });
    if (!updated) throw new AppError(404, "NOT_FOUND", "Claim not found.");
    await activity.create({
      actorId: actor.id,
      action: "claim.reviewed",
      resourceType: "claim",
      resourceId: claimId,
      metadata: { decision: "reject", itemId: item.id },
    });
    return updated;
  }

  await approveWithItem(claim, item, actor.id, note);
  const updated = await claims.findById(claimId);
  if (!updated) throw new AppError(404, "NOT_FOUND", "Claim not found.");
  await activity.create({
    actorId: actor.id,
    action: "claim.reviewed",
    resourceType: "claim",
    resourceId: claimId,
    metadata: { decision: "approve", itemId: item.id },
  });
  await activity.create({
    actorId: actor.id,
    action: "item.resolved",
    resourceType: "item",
    resourceId: item.id,
    metadata: { title: item.title },
  });
  return updated;
}

export async function listIncomingClaims(userId: string) {
  const ids = await items.findIds({ reporter: userId, type: "found", status: "approved" });
  if (ids.length === 0) return [];
  const result = await claims.search({ item: { $in: ids }, status: "pending" }, 1, 50);
  return result.claims;
}

export async function listMyClaims(userId: string, page: number, limit: number) {
  const result = await claims.search({ claimant: userId }, page, limit);
  return { claims: result.claims, pagination: toPagination(page, limit, result.total) };
}

export async function listItemClaims(itemId: string, page: number, limit: number) {
  const result = await claims.search({ item: itemId }, page, limit);
  return { claims: result.claims, pagination: toPagination(page, limit, result.total) };
}

export async function listClaims(filter: { status?: string }, page: number, limit: number) {
  const query = filter.status ? { status: filter.status } : {};
  const result = await claims.search(query, page, limit);
  return { claims: result.claims, pagination: toPagination(page, limit, result.total) };
}

export async function getClaimForViewer(
  claimId: string,
  viewer: { id: string; role: Role },
): Promise<{ claim: ClaimRecord; item: ItemRecord }> {
  const claim = await claims.findById(claimId);
  if (!claim) throw new AppError(404, "NOT_FOUND", "Claim not found.");
  const item = await items.findById(claim.itemId);
  if (!item) throw new AppError(404, "NOT_FOUND", "Claim not found.");
  const allowed =
    viewer.role === "admin" || viewer.id === claim.claimantId || viewer.id === item.reporterId;
  if (!allowed) throw new AppError(403, "FORBIDDEN", "You cannot view this claim.");
  return { claim, item };
}

function assertClaimable(item: ItemRecord | null, claimantId: string): asserts item is ItemRecord {
  if (!item || item.status === "archived") {
    throw new AppError(404, "NOT_FOUND", "Item not found.");
  }
  if (item.type !== "found") {
    throw new AppError(409, "CONFLICT", "Claims can only be submitted for found items.");
  }
  if (item.status === "resolved") {
    throw new AppError(409, "CONFLICT", "This item has already been marked returned.");
  }
  if (item.status !== "approved") {
    throw new AppError(409, "CONFLICT", "This report is not open for claims.");
  }
  if (item.reporterId === claimantId) {
    throw new AppError(403, "FORBIDDEN", "You cannot claim an item you reported.");
  }
}

async function approveWithItem(
  claim: ClaimRecord,
  item: ItemRecord,
  reviewerId: string,
  note?: string,
): Promise<void> {
  const reviewedAt = new Date();
  const claimUpdate = {
    status: "approved",
    reviewedBy: reviewerId,
    reviewedAt,
    reviewNote: note?.trim() ?? "",
  };
  const itemUpdate = {
    status: "resolved",
    resolution: { resolvedBy: reviewerId, resolvedAt: reviewedAt, claim: claim.id },
  };
  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const claimResult = await ClaimModel.updateOne(
          { _id: claim.id, status: "pending" },
          claimUpdate,
          { session },
        );
        if (claimResult.modifiedCount !== 1) {
          throw new AppError(409, "CONFLICT", "This claim has already been reviewed.");
        }
        const itemResult = await ItemModel.updateOne(
          { _id: item.id, status: "approved" },
          itemUpdate,
          { session },
        );
        if (itemResult.modifiedCount !== 1) {
          throw new AppError(409, "CONFLICT", "This report can no longer be resolved.");
        }
        await ClaimModel.updateMany(
          { item: item.id, status: "pending", _id: { $ne: claim.id } },
          {
            status: "rejected",
            reviewNote: "Another claim was approved for this item.",
            reviewedBy: reviewerId,
            reviewedAt,
          },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (!isTransactionUnsupported(error)) throw error;
    logError("Transactions are unavailable. Applying claim approval sequentially.", error);
    const claimResult = await ClaimModel.updateOne({ _id: claim.id, status: "pending" }, claimUpdate);
    if (claimResult.modifiedCount !== 1) {
      throw new AppError(409, "CONFLICT", "This claim has already been reviewed.");
    }
    const itemResult = await ItemModel.updateOne({ _id: item.id, status: "approved" }, itemUpdate);
    if (itemResult.modifiedCount !== 1) {
      await ClaimModel.updateOne({ _id: claim.id }, { status: "pending", reviewedBy: null, reviewedAt: null });
      throw new AppError(409, "CONFLICT", "This report can no longer be resolved.");
    }
    await ClaimModel.updateMany(
      { item: item.id, status: "pending", _id: { $ne: claim.id } },
      {
        status: "rejected",
        reviewNote: "Another claim was approved for this item.",
        reviewedBy: reviewerId,
        reviewedAt,
      },
    );
  }
}

function isDuplicateKey(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

function isTransactionUnsupported(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /replica set|transaction numbers are only allowed/i.test(error.message);
}
