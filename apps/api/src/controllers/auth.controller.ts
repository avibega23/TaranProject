import type { Request, Response } from "express";
import { getEnv } from "../config/env.js";
import { login, logout, registerStudent, updateProfile } from "../services/auth.service.js";
import { toPublicUser } from "../utils/presenters.js";
import { sendMessage, sendSuccess } from "../utils/http.js";
import { AppError } from "../utils/errors.js";

function setSessionCookie(res: Response, token: string) {
  const env = getEnv();
  res.cookie(env.SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
    maxAge: env.SESSION_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
}

function clearSessionCookie(res: Response) {
  const env = getEnv();
  res.clearCookie(env.SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.NODE_ENV === "production",
    path: "/",
  });
}

export async function register(req: Request, res: Response) {
  const result = await registerStudent(req.body);
  setSessionCookie(res, result.token);
  sendSuccess(res, { user: toPublicUser(result.user) }, 201);
}

export async function signIn(req: Request, res: Response) {
  const result = await login(req.body);
  setSessionCookie(res, result.token);
  sendSuccess(res, { user: toPublicUser(result.user) });
}

export async function signOut(req: Request, res: Response) {
  const token = (req.cookies?.[getEnv().SESSION_COOKIE_NAME] as string | undefined) ?? req.sessionToken;
  await logout(token);
  clearSessionCookie(res);
  sendMessage(res, "Signed out.");
}

export async function me(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Sign in to continue.");
  sendSuccess(res, {
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      studentId: req.user.studentId,
      role: req.user.role,
    },
  });
}

export async function updateMe(req: Request, res: Response) {
  if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Sign in to continue.");
  const user = await updateProfile(req.user.id, req.body.name);
  sendSuccess(res, { user: toPublicUser(user) });
}
