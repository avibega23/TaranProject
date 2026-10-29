import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import type { Request, Response } from "express";
import { ItemRepository } from "../repositories/item.repository.js";
import { resolveUploadPath } from "../services/upload.service.js";
import { AppError } from "../utils/errors.js";

const items = new ItemRepository();

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function showUpload(req: Request, res: Response) {
  const filename = req.params.filename;
  const fullPath = resolveUploadPath(filename);
  if (!fullPath) throw new AppError(404, "NOT_FOUND", "Image not found.");
  const item = await items.findByImage(filename);
  if (!item || item.status === "archived") throw new AppError(404, "NOT_FOUND", "Image not found.");
  const isPublic = item.status === "approved" || item.status === "resolved";
  const isOwner = req.user?.id === item.reporterId;
  const isAdmin = req.user?.role === "admin";
  if (!isPublic && !isOwner && !isAdmin) throw new AppError(404, "NOT_FOUND", "Image not found.");
  try {
    await access(fullPath);
  } catch {
    throw new AppError(404, "NOT_FOUND", "Image not found.");
  }
  const extension = filename.split(".").pop() ?? "";
  res.setHeader("Content-Type", CONTENT_TYPES[extension] ?? "application/octet-stream");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", isPublic ? "public, max-age=3600" : "private, no-store");
  createReadStream(fullPath).pipe(res);
}
