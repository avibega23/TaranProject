import type { Request, Response } from "express";
import {
  cancelClaim,
  createClaim,
  getClaimForViewer,
  listIncomingClaims,
  listMyClaims,
  reviewClaim,
} from "../services/claim.service.js";
import { toClaimView } from "../utils/presenters.js";
import { sendSuccess } from "../utils/http.js";
import { AppError } from "../utils/errors.js";
import { readPage } from "../utils/pagination.js";

function actor(req: Request) {
  if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Sign in to continue.");
  return req.user;
}

export async function postClaim(req: Request, res: Response) {
  const user = actor(req);
  const claim = await createClaim(req.params.id, user.id, req.body);
  const loaded = await getClaimForViewer(claim.id, user);
  sendSuccess(res, toClaimView(loaded.claim, user, loaded.item), 201);
}

export async function incomingClaims(req: Request, res: Response) {
  const user = actor(req);
  const rows = await listIncomingClaims(user.id);
  const views = [];
  for (const claim of rows) {
    const loaded = await getClaimForViewer(claim.id, user);
    views.push(toClaimView(loaded.claim, user, loaded.item));
  }
  sendSuccess(res, views);
}

export async function myClaims(req: Request, res: Response) {
  const user = actor(req);
  const { page, limit } = readPage(req.query);
  const result = await listMyClaims(user.id, page, limit);
  const views = [];
  for (const claim of result.claims) {
    const loaded = await getClaimForViewer(claim.id, user);
    views.push(toClaimView(loaded.claim, user, loaded.item));
  }
  sendSuccess(res, views, 200, result.pagination);
}

export async function getClaim(req: Request, res: Response) {
  const user = actor(req);
  const loaded = await getClaimForViewer(req.params.id, user);
  sendSuccess(res, toClaimView(loaded.claim, user, loaded.item));
}

export async function cancel(req: Request, res: Response) {
  const user = actor(req);
  const claim = await cancelClaim(req.params.id, user.id);
  const loaded = await getClaimForViewer(claim.id, user);
  sendSuccess(res, toClaimView(loaded.claim, user, loaded.item));
}

export async function review(req: Request, res: Response) {
  const user = actor(req);
  const claim = await reviewClaim(req.params.id, user, req.body.decision, req.body.note);
  const loaded = await getClaimForViewer(claim.id, user);
  sendSuccess(res, toClaimView(loaded.claim, user, loaded.item));
}
