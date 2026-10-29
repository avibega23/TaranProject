import { Schema, model, type InferSchemaType } from "mongoose";
import { ACCOUNT_STATUSES, ROLES } from "../config/constants.js";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 160 },
    studentId: { type: String, required: true, trim: true, uppercase: true, maxlength: 32 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: "student" },
    accountStatus: { type: String, enum: ACCOUNT_STATUSES, required: true, default: "active" },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ studentId: 1 }, { unique: true });

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: Schema.Types.ObjectId };
export const UserModel = model("User", userSchema);
