import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { AppError } from "../utils/errors.js";

function details(error: { issues: { path: (string | number)[]; message: string }[] }) {
  return error.issues.map((issue) => ({
    path: issue.path.join(".") || "body",
    message: issue.message,
  }));
}

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) {
      next(new AppError(422, "VALIDATION_ERROR", "Some fields need attention.", details(parsed.error)));
      return;
    }
    req.body = parsed.data;
    next();
  };
}

export function validateQuery(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) {
      next(new AppError(422, "VALIDATION_ERROR", "Those filters are not valid.", details(parsed.error)));
      return;
    }
    req.query = parsed.data as Request["query"];
    next();
  };
}

export function validateParams(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      next(new AppError(400, "BAD_REQUEST", "That request is not valid.", details(parsed.error)));
      return;
    }
    req.params = parsed.data as Request["params"];
    next();
  };
}
