import { ActivityModel } from "../models/activity.model.js";

export type ActivityRecord = {
  id: string;
  actorId: string | null;
  action: string;
  resourceType: "user" | "item" | "claim";
  resourceId: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
};

export class ActivityRepository {
  async create(input: {
    actorId: string | null;
    action: string;
    resourceType: "user" | "item" | "claim";
    resourceId: string;
    metadata?: Record<string, unknown>;
    isDemo?: boolean;
  }): Promise<void> {
    await ActivityModel.create({
      actor: input.actorId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      metadata: input.metadata ?? {},
      isDemo: input.isDemo ?? false,
    });
  }

  async listForActor(actorId: string, limit: number): Promise<ActivityRecord[]> {
    const docs = await ActivityModel.find({ actor: actorId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec();
    return docs.map(mapActivity);
  }

  async listForResource(resourceType: string, resourceId: string): Promise<ActivityRecord[]> {
    const docs = await ActivityModel.find({ resourceType, resourceId })
      .sort({ createdAt: -1 })
      .limit(50)
      .exec();
    return docs.map(mapActivity);
  }

  async listRecent(limit: number): Promise<ActivityRecord[]> {
    const docs = await ActivityModel.find().sort({ createdAt: -1 }).limit(limit).exec();
    return docs.map(mapActivity);
  }
}

function mapActivity(doc: {
  _id: { toString(): string };
  actor?: { toString(): string } | null;
  action: string;
  resourceType: "user" | "item" | "claim";
  resourceId: { toString(): string };
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}): ActivityRecord {
  return {
    id: doc._id.toString(),
    actorId: doc.actor ? doc.actor.toString() : null,
    action: doc.action,
    resourceType: doc.resourceType,
    resourceId: doc.resourceId.toString(),
    metadata: doc.metadata ?? {},
    createdAt: doc.createdAt,
  };
}
