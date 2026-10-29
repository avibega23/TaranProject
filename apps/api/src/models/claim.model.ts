import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import { CLAIM_STATUSES } from "../config/constants.js";

const claimSchema = new Schema(
  {
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    claimant: { type: Schema.Types.ObjectId, ref: "User", required: true },
    explanation: { type: String, required: true, trim: true, maxlength: 1000 },
    proofDescription: { type: String, default: "", maxlength: 1000 },
    status: { type: String, enum: CLAIM_STATUSES, required: true, default: "pending" },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, default: "", maxlength: 500 },
    isDemo: { type: Boolean, default: false },
    seedKey: { type: String },
  },
  { timestamps: true },
);

claimSchema.index(
  { item: 1, claimant: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } },
);
claimSchema.index({ claimant: 1, createdAt: -1 });
claimSchema.index({ item: 1, status: 1 });
claimSchema.index({ status: 1, createdAt: -1 });
claimSchema.index({ seedKey: 1 }, { unique: true, sparse: true });

export type ClaimDocument = InferSchemaType<typeof claimSchema> & {
  _id: Types.ObjectId;
  item: Types.ObjectId;
  claimant: Types.ObjectId;
};
export const ClaimModel = model("Claim", claimSchema);
