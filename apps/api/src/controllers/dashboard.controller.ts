import type { Request, Response } from "express";
import { adminOverview, dashboardSummary, myActivity } from "../services/dashboard.service.js";
import { toActivityView, toItemView } from "../utils/presenters.js";
import { sendSuccess } from "../utils/http.js";
import { AppError } from "../utils/errors.js";
import mongoose from "mongoose";

export async function health(_req: Request, res: Response) {
  const connected = mongoose.connection.readyState === 1;
  if (!connected) {
    res.status(503).json({
      success: false,
      message: "Database is unavailable.",
      code: "DATABASE_UNAVAILABLE",
      data: { status: "error", database: "disconnected" },
    });
    return;
  }
  sendSuccess(res, { status: "ok", database: "connected" });
}

export async function summary(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Sign in to continue.");
  const data = await dashboardSummary(req.user);
  sendSuccess(res, {
    lostReports: data.lostReports,
    foundReports: data.foundReports,
    activeClaims: data.activeClaims,
    pendingDecisions: data.pendingDecisions,
    resolvedReports: data.resolvedReports,
    recentActivity: data.recentActivity.map(toActivityView),
    recentItems: data.recentItems.map((item) => toItemView(item, req.user!)),
  });
}

export async function activity(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Sign in to continue.");
  const rows = await myActivity(req.user.id);
  sendSuccess(res, rows.map(toActivityView));
}

export async function overview(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Sign in to continue.");
  const data = await adminOverview();
  sendSuccess(res, {
    ...data,
    recentActivity: data.recentActivity.map(toActivityView),
  });
}
