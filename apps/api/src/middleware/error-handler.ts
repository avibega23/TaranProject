import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { AppError } from "../utils/errors.js";
import { getEnv } from "../config/env.js";
import { logError } from "../utils/logger.js";

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    res.status(error.status).json({
      success: false,
      message: error.message,
      code: error.code,
      ...(error.details ? { details: error.details } : {}),
    });
    return;
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "That image is larger than the upload limit."
        : "The upload could not be processed.";
    res.status(400).json({ success: false, message, code: "VALIDATION_ERROR" });
    return;
  }

  if (isMongoDuplicate(error)) {
    res.status(409).json({
      success: false,
      message: "That record already exists.",
      code: "CONFLICT",
    });
    return;
  }

  if (isCastError(error)) {
    res.status(400).json({ success: false, message: "That request is not valid.", code: "BAD_REQUEST" });
    return;
  }

  logError("Unhandled request error", error);
  const message =
    getEnv().NODE_ENV === "production"
      ? "Something went wrong. Please try again."
      : error instanceof Error
        ? error.message
        : "Something went wrong. Please try again.";
  res.status(500).json({ success: false, message, code: "INTERNAL_ERROR" });
}

function isMongoDuplicate(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === 11000;
}

function isCastError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "name" in error && error.name === "CastError";
}
