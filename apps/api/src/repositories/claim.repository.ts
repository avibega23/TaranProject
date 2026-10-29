import { Types, type FilterQuery } from "mongoose";
import { ClaimModel } from "../models/claim.model.js";
import type { ClaimStatus } from "../config/constants.js";

export type ClaimRecord = {
  id: string;
  itemId: string;
  claimantId: string;
  explanation: string;
  proofDescription: string;
  status: ClaimStatus;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewNote: string;
  createdAt: Date;
  updatedAt: Date;
};

type ClaimDoc = {
  _id: Types.ObjectId;
  item: Types.ObjectId;
  claimant: Types.ObjectId;
  explanation: string;
  proofDescription?: string;
  status: ClaimStatus;
  reviewedBy?: Types.ObjectId | null;
  reviewedAt?: Date | null;
  reviewNote?: string;
  createdAt: Date;
  updatedAt: Date;
};

function mapClaim(doc: ClaimDoc): ClaimRecord {
  return {
    id: doc._id.toString(),
    itemId: doc.item.toString(),
    claimantId: doc.claimant.toString(),
    explanation: doc.explanation,
    proofDescription: doc.proofDescription ?? "",
    status: doc.status,
    reviewedBy: doc.reviewedBy ? doc.reviewedBy.toString() : null,
    reviewedAt: doc.reviewedAt ?? null,
    reviewNote: doc.reviewNote ?? "",
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class ClaimRepository {
  async create(input: {
    itemId: string;
    claimantId: string;
    explanation: string;
    proofDescription: string;
    isDemo?: boolean;
    seedKey?: string;
    status?: ClaimStatus;
  }): Promise<ClaimRecord> {
    const doc = await ClaimModel.create({
      item: input.itemId,
      claimant: input.claimantId,
      explanation: input.explanation,
      proofDescription: input.proofDescription,
      status: input.status ?? "pending",
      isDemo: input.isDemo ?? false,
      seedKey: input.seedKey,
    });
    return mapClaim(doc);
  }

  async findById(id: string): Promise<ClaimRecord | null> {
    if (!/^[a-f\d]{24}$/i.test(id)) return null;
    const doc = await ClaimModel.findById(id).exec();
    return doc ? mapClaim(doc) : null;
  }

  async findPending(itemId: string, claimantId: string): Promise<ClaimRecord | null> {
    const doc = await ClaimModel.findOne({
      item: itemId,
      claimant: claimantId,
      status: "pending",
    }).exec();
    return doc ? mapClaim(doc) : null;
  }

  async search(filter: FilterQuery<typeof ClaimModel>, page: number, limit: number) {
    const [docs, total] = await Promise.all([
      ClaimModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      ClaimModel.countDocuments(filter).exec(),
    ]);
    return { claims: docs.map((doc) => mapClaim(doc)), total };
  }

  async updateById(id: string, update: Record<string, unknown>): Promise<ClaimRecord | null> {
    const doc = await ClaimModel.findByIdAndUpdate(id, update, { new: true }).exec();
    return doc ? mapClaim(doc) : null;
  }

  async count(filter: FilterQuery<typeof ClaimModel>): Promise<number> {
    return ClaimModel.countDocuments(filter).exec();
  }

  async rejectOtherPending(itemId: string, keepId: string, note: string, reviewerId: string) {
    await ClaimModel.updateMany(
      { item: itemId, status: "pending", _id: { $ne: keepId } },
      {
        status: "rejected",
        reviewNote: note,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      },
    ).exec();
  }

  async upsertBySeedKey(
    seedKey: string,
    input: {
      itemId: string;
      claimantId: string;
      explanation: string;
      proofDescription: string;
      status: ClaimStatus;
      reviewedBy?: string | null;
      reviewedAt?: Date | null;
      reviewNote?: string;
    },
  ): Promise<ClaimRecord> {
    const doc = await ClaimModel.findOneAndUpdate(
      { seedKey },
      {
        $set: {
          item: input.itemId,
          claimant: input.claimantId,
          explanation: input.explanation,
          proofDescription: input.proofDescription,
          status: input.status,
          reviewedBy: input.reviewedBy ?? null,
          reviewedAt: input.reviewedAt ?? null,
          reviewNote: input.reviewNote ?? "",
          isDemo: true,
          seedKey,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    return mapClaim(doc!);
  }
}
