import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const activitySchema = new Schema(
  {
    actor: { type: Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true, maxlength: 80 },
    resourceType: { type: String, required: true, enum: ["user", "item", "claim"] },
    resourceId: { type: Schema.Types.ObjectId, required: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

activitySchema.index({ actor: 1, createdAt: -1 });
activitySchema.index({ resourceType: 1, resourceId: 1, createdAt: -1 });
activitySchema.index({ createdAt: -1 });

export type ActivityDocument = InferSchemaType<typeof activitySchema> & {
  _id: Types.ObjectId;
  actor: Types.ObjectId | null;
  resourceId: Types.ObjectId;
};
export const ActivityModel = model("Activity", activitySchema);
