import { Types, type FilterQuery } from "mongoose";
import { ItemModel } from "../models/item.model.js";
import type { Category, ContactPreference, ItemStatus, ItemType } from "../config/constants.js";

export type ItemRecord = {
  id: string;
  title: string;
  description: string;
  searchText: string;
  type: ItemType;
  category: Category;
  location: string;
  eventDate: Date;
  imageFilename: string | null;
  identifyingDetails: string;
  contactPreference: ContactPreference;
  notes: string;
  reporterId: string;
  status: ItemStatus;
  moderation: {
    reviewedBy: string | null;
    reviewedAt: Date | null;
    note: string;
  };
  resolution: {
    resolvedBy: string | null;
    resolvedAt: Date | null;
    claimId: string | null;
  };
  createdAt: Date;
  updatedAt: Date;
};

export type ItemCreate = {
  title: string;
  description: string;
  searchText: string;
  type: ItemType;
  category: Category;
  location: string;
  eventDate: Date;
  imageFilename: string | null;
  identifyingDetails: string;
  contactPreference: ContactPreference;
  notes: string;
  reporterId: string;
  status?: ItemStatus;
  isDemo?: boolean;
  seedKey?: string | null;
};

type ItemDoc = {
  _id: Types.ObjectId;
  title: string;
  description: string;
  searchText: string;
  type: ItemType;
  category: Category;
  location: string;
  eventDate: Date;
  imageFilename?: string | null;
  identifyingDetails?: string;
  contactPreference: ContactPreference;
  notes?: string;
  reporter: Types.ObjectId;
  status: ItemStatus;
  moderation?: {
    reviewedBy?: Types.ObjectId | null;
    reviewedAt?: Date | null;
    note?: string;
  };
  resolution?: {
    resolvedBy?: Types.ObjectId | null;
    resolvedAt?: Date | null;
    claim?: Types.ObjectId | null;
  };
  createdAt: Date;
  updatedAt: Date;
};

function mapItem(input: unknown): ItemRecord {
  const doc = input as ItemDoc;
  return {
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    searchText: doc.searchText,
    type: doc.type,
    category: doc.category,
    location: doc.location,
    eventDate: doc.eventDate,
    imageFilename: doc.imageFilename ?? null,
    identifyingDetails: doc.identifyingDetails ?? "",
    contactPreference: doc.contactPreference,
    notes: doc.notes ?? "",
    reporterId: doc.reporter.toString(),
    status: doc.status,
    moderation: {
      reviewedBy: doc.moderation?.reviewedBy ? doc.moderation.reviewedBy.toString() : null,
      reviewedAt: doc.moderation?.reviewedAt ?? null,
      note: doc.moderation?.note ?? "",
    },
    resolution: {
      resolvedBy: doc.resolution?.resolvedBy ? doc.resolution.resolvedBy.toString() : null,
      resolvedAt: doc.resolution?.resolvedAt ?? null,
      claimId: doc.resolution?.claim ? doc.resolution.claim.toString() : null,
    },
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export class ItemRepository {
  async create(input: ItemCreate): Promise<ItemRecord> {
    const doc = await ItemModel.create({
      title: input.title,
      description: input.description,
      searchText: input.searchText,
      type: input.type,
      category: input.category,
      location: input.location,
      eventDate: input.eventDate,
      imageFilename: input.imageFilename,
      identifyingDetails: input.identifyingDetails,
      contactPreference: input.contactPreference,
      notes: input.notes,
      reporter: input.reporterId,
      status: input.status ?? "pending",
      isDemo: input.isDemo ?? false,
      ...(input.seedKey ? { seedKey: input.seedKey } : {}),
    });
    return mapItem(doc);
  }

  async findById(id: string): Promise<ItemRecord | null> {
    if (!/^[a-f\d]{24}$/i.test(id)) return null;
    const doc = await ItemModel.findById(id).exec();
    return doc ? mapItem(doc) : null;
  }

  async findByImage(filename: string): Promise<ItemRecord | null> {
    const doc = await ItemModel.findOne({ imageFilename: filename }).exec();
    return doc ? mapItem(doc) : null;
  }

  async search(filter: FilterQuery<typeof ItemModel>, page: number, limit: number) {
    const [docs, total] = await Promise.all([
      ItemModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .exec(),
      ItemModel.countDocuments(filter).exec(),
    ]);
    return { items: docs.map((doc) => mapItem(doc)), total };
  }

  async updateById(id: string, update: Record<string, unknown>): Promise<ItemRecord | null> {
    const doc = await ItemModel.findByIdAndUpdate(id, update, { new: true }).exec();
    return doc ? mapItem(doc) : null;
  }

  async count(filter: FilterQuery<typeof ItemModel>): Promise<number> {
    return ItemModel.countDocuments(filter).exec();
  }

  async findIds(filter: FilterQuery<typeof ItemModel>, limit = 500): Promise<string[]> {
    const docs = await ItemModel.find(filter).select("_id").limit(limit).exec();
    return docs.map((doc) => doc._id.toString());
  }

  async findMatchCandidates(input: {
    type: ItemType;
    excludeId: string;
    category: Category;
    from: Date;
    to: Date;
    limit: number;
  }): Promise<ItemRecord[]> {
    const docs = await ItemModel.find({
      type: input.type,
      status: "approved",
      _id: { $ne: input.excludeId },
      $or: [
        { category: input.category },
        { eventDate: { $gte: input.from, $lte: input.to } },
      ],
    })
      .limit(input.limit)
      .exec();
    return docs.map((doc) => mapItem(doc));
  }

  async upsertBySeedKey(seedKey: string, input: ItemCreate): Promise<ItemRecord> {
    const doc = await ItemModel.findOneAndUpdate(
      { seedKey },
      {
        $set: {
          title: input.title,
          description: input.description,
          searchText: input.searchText,
          type: input.type,
          category: input.category,
          location: input.location,
          eventDate: input.eventDate,
          imageFilename: input.imageFilename,
          identifyingDetails: input.identifyingDetails,
          contactPreference: input.contactPreference,
          notes: input.notes,
          reporter: input.reporterId,
          status: input.status ?? "pending",
          isDemo: true,
          seedKey,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
    return mapItem(doc!);
  }
}
