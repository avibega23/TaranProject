import type { NextFunction, Request, Response } from "express";
import { getEnv } from "../config/env.js";
import { getUserForToken } from "../services/auth.service.js";
import { AppError } from "../utils/errors.js";
import type { Role } from "../config/constants.js";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[getEnv().SESSION_COOKIE_NAME] as string | undefined;
    const user = await getUserForToken(token);
    if (!user) {
      next(new AppError(401, "UNAUTHORIZED", "Sign in to continue."));
      return;
    }
    req.user = {
      id: user.id,
      role: user.role,
      name: user.name,
      email: user.email,
      studentId: user.studentId,
    };
    req.sessionToken = token;
    next();
  } catch (error) {
    next(error);
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[getEnv().SESSION_COOKIE_NAME] as string | undefined;
    const user = await getUserForToken(token);
    if (user) {
      req.user = {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        studentId: user.studentId,
      };
      req.sessionToken = token;
    }
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(role: Role) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError(401, "UNAUTHORIZED", "Sign in to continue."));
      return;
    }
    if (req.user.role !== role) {
      next(new AppError(403, "FORBIDDEN", "You do not have access to this action."));
      return;
    }
    next();
  };
}
