import type { Request, Response } from "express";
import type { Pagination } from "./pagination.js";

export function sendSuccess(
  res: Response,
  data: unknown,
  status = 200,
  pagination?: Pagination,
): void {
  res.status(status).json({
    success: true,
    data,
    ...(pagination ? { pagination } : {}),
  });
}

export function sendMessage(res: Response, message: string, status = 200): void {
  res.status(status).json({ success: true, message });
}

export function requestMeta(req: Request): { ip?: string; method: string; path: string } {
  return { method: req.method, path: req.originalUrl };
}
