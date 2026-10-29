import { ActivityRepository } from "../repositories/activity.repository.js";

const activity = new ActivityRepository();

export function listForResource(resourceType: "user" | "item" | "claim", resourceId: string) {
  return activity.listForResource(resourceType, resourceId);
}
