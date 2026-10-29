import { ItemRepository } from "../repositories/item.repository.js";
import { ClaimRepository } from "../repositories/claim.repository.js";
import { ActivityRepository } from "../repositories/activity.repository.js";
import type { Role } from "../config/constants.js";

const items = new ItemRepository();
const claims = new ClaimRepository();
const activity = new ActivityRepository();

export async function dashboardSummary(user: { id: string; role: Role }) {
  const [lostReports, foundReports, activeClaims, pendingDecisions, resolvedReports, recentActivity, recent] =
    await Promise.all([
      items.count({ reporter: user.id, type: "lost", status: { $ne: "archived" } }),
      items.count({ reporter: user.id, type: "found", status: { $ne: "archived" } }),
      claims.count({ claimant: user.id, status: "pending" }),
      user.role === "admin"
        ? claims.count({ status: "pending" })
        : countOwnerDecisions(user.id),
      items.count({ reporter: user.id, status: "resolved" }),
      activity.listForActor(user.id, 8),
      items.search({ reporter: user.id, status: { $ne: "archived" } }, 1, 4),
    ]);

  return {
    lostReports,
    foundReports,
    activeClaims,
    pendingDecisions,
    resolvedReports,
    recentActivity,
    recentItems: recent.items,
  };
}

async function countOwnerDecisions(userId: string): Promise<number> {
  const ids = await items.findIds({ reporter: userId, type: "found", status: "approved" });
  if (ids.length === 0) return 0;
  return claims.count({ item: { $in: ids }, status: "pending" });
}

export async function myActivity(userId: string) {
  return activity.listForActor(userId, 30);
}

export async function adminOverview() {
  const [pendingReports, approvedReports, rejectedReports, resolvedReports, pendingClaims, openLost, openFound] =
    await Promise.all([
      items.count({ status: "pending" }),
      items.count({ status: "approved" }),
      items.count({ status: "rejected" }),
      items.count({ status: "resolved" }),
      claims.count({ status: "pending" }),
      items.count({ type: "lost", status: "approved" }),
      items.count({ type: "found", status: "approved" }),
    ]);
  const recentActivity = await activity.listRecent(12);
  return {
    pendingReports,
    approvedReports,
    rejectedReports,
    resolvedReports,
    pendingClaims,
    openLost,
    openFound,
    recentActivity,
  };
}
