import type { Request, Response } from "express";
import { moderateItem, searchManageableItems, type ItemQuery } from "../services/item.service.js";
import { getClaimForViewer, listClaims } from "../services/claim.service.js";
import { listForResource } from "../services/activity-query.service.js";
import { toActivityView, toClaimView, toItemView } from "../utils/presenters.js";
import { sendSuccess } from "../utils/http.js";
import { AppError } from "../utils/errors.js";
import { readPage } from "../utils/pagination.js";
import { CLAIM_STATUSES } from "../config/constants.js";

export async function adminItems(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Sign in to continue.");
  const query = req.query as unknown as ItemQuery;
  const result = await searchManageableItems(query);
  sendSuccess(
    res,
    result.items.map((item) => toItemView(item, req.user!)),
    200,
    result.pagination,
  );
}

export async function moderate(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Sign in to continue.");
  const item = await moderateItem(req.params.id, req.user.id, req.body.action, req.body.note);
  sendSuccess(res, toItemView(item, req.user));
}

export async function adminClaims(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Sign in to continue.");
  const { page, limit } = readPage(req.query);
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  if (status && !CLAIM_STATUSES.includes(status as (typeof CLAIM_STATUSES)[number])) {
    throw new AppError(422, "VALIDATION_ERROR", "That claim status is not valid.");
  }
  const result = await listClaims({ status }, page, limit);
  const views = [];
  for (const claim of result.claims) {
    const loaded = await getClaimForViewer(claim.id, req.user);
    views.push(toClaimView(loaded.claim, req.user, loaded.item));
  }
  sendSuccess(res, views, 200, result.pagination);
}

export async function history(req: Request, res: Response) {
  const resourceType = req.params.resourceType;
  if (resourceType !== "item" && resourceType !== "claim" && resourceType !== "user") {
    throw new AppError(400, "BAD_REQUEST", "Unknown history type.");
  }
  const rows = await listForResource(resourceType, req.params.id);
  sendSuccess(res, rows.map(toActivityView));
}
