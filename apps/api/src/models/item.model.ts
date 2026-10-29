import { Schema, model, type InferSchemaType, type Types } from "mongoose";
import {
  CATEGORIES,
  CONTACT_PREFERENCES,
  ITEM_STATUSES,
  ITEM_TYPES,
} from "../config/constants.js";

const itemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    searchText: { type: String, required: true, maxlength: 4000 },
    type: { type: String, enum: ITEM_TYPES, required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    location: { type: String, required: true, trim: true, maxlength: 120 },
    eventDate: { type: Date, required: true },
    imageFilename: { type: String, default: null },
    identifyingDetails: { type: String, default: "", maxlength: 500 },
    contactPreference: { type: String, enum: CONTACT_PREFERENCES, required: true, default: "in_app" },
    notes: { type: String, default: "", maxlength: 1000 },
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ITEM_STATUSES, required: true, default: "pending" },
    moderation: {
      reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
      reviewedAt: { type: Date, default: null },
      note: { type: String, default: "", maxlength: 500 },
    },
    resolution: {
      resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
      resolvedAt: { type: Date, default: null },
      claim: { type: Schema.Types.ObjectId, ref: "Claim", default: null },
    },
    isDemo: { type: Boolean, default: false },
    seedKey: { type: String },
  },
  { timestamps: true },
);

itemSchema.index({ status: 1, type: 1, category: 1, createdAt: -1 });
itemSchema.index({ status: 1, eventDate: -1 });
itemSchema.index({ reporter: 1, createdAt: -1 });
itemSchema.index({ searchText: 1 });
itemSchema.index({ location: 1 });
itemSchema.index({ seedKey: 1 }, { unique: true, sparse: true });

export type ItemDocument = InferSchemaType<typeof itemSchema> & {
  _id: Types.ObjectId;
  reporter: Types.ObjectId;
};
export const ItemModel = model("Item", itemSchema);
