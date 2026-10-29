import { Types } from "mongoose";

export function parseObjectId(id: string): Types.ObjectId | null {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  return new Types.ObjectId(id);
}
