import type { Request, Response } from "express";
import {
  archiveItem,
  createItem,
  getItemForViewer,
  publicStats,
  searchManageableItems,
  searchPublicItems,
  updateOwnItem,
  type ItemQuery,
} from "../services/item.service.js";
import { findMatches } from "../services/matching.service.js";
import { saveItemImage } from "../services/upload.service.js";
import { toItemView } from "../utils/presenters.js";
import { sendSuccess } from "../utils/http.js";
import { AppError } from "../utils/errors.js";

function viewer(req: Request) {
  return req.user ? { id: req.user.id, role: req.user.role } : null;
}

export async function listItems(req: Request, res: Response) {
  const query = req.query as unknown as ItemQuery;
  const result = await searchPublicItems(query);
  sendSuccess(
    res,
    result.items.map((item) => toItemView(item, viewer(req))),
    200,
    result.pagination,
  );
}

export async function itemStats(_req: Request, res: Response) {
  sendSuccess(res, await publicStats());
}

export async function getItem(req: Request, res: Response) {
  const item = await getItemForViewer(req.params.id, viewer(req));
  sendSuccess(res, toItemView(item, viewer(req)));
}

export async function postItem(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Sign in to continue.");
  const imageFilename = req.file ? await saveItemImage(req.file) : null;
  const item = await createItem(req.user.id, { ...req.body, imageFilename });
  sendSuccess(res, toItemView(item, viewer(req)), 201);
}

export async function patchItem(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Sign in to continue.");
  const imageFilename = req.file ? await saveItemImage(req.file) : undefined;
  const item = await updateOwnItem(req.params.id, req.user, {
    ...req.body,
    ...(imageFilename ? { imageFilename } : {}),
  });
  sendSuccess(res, toItemView(item, viewer(req)));
}

export async function removeItem(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Sign in to continue.");
  const item = await archiveItem(req.params.id, req.user);
  sendSuccess(res, toItemView(item, viewer(req)));
}

export async function itemMatches(req: Request, res: Response) {
  const matches = await findMatches(req.params.id, viewer(req));
  sendSuccess(
    res,
    matches.map((match) => ({
      item: toItemView(match.item, viewer(req)),
      score: match.score,
      reasons: match.reasons,
      sharedKeywords: match.sharedKeywords,
      label: "Similarity estimate",
    })),
  );
}

export async function myItems(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Sign in to continue.");
  const query = req.query as unknown as ItemQuery;
  const result = await searchManageableItems({ ...query, reporterId: req.user.id });
  sendSuccess(
    res,
    result.items.map((item) => toItemView(item, viewer(req))),
    200,
    result.pagination,
  );
}
