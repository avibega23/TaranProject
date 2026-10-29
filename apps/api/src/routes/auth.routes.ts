import { Router } from "express";
import { me, register, signIn, signOut } from "../controllers/auth.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { authRateLimit } from "../middleware/rate-limit.js";
import { validateBody } from "../middleware/validate.js";
import { loginSchema, registerSchema } from "../validators/schemas.js";

export const authRouter = Router();

authRouter.post("/register", authRateLimit, validateBody(registerSchema), asyncHandler(register));
authRouter.post("/login", authRateLimit, validateBody(loginSchema), asyncHandler(signIn));
authRouter.post("/logout", asyncHandler(signOut));
authRouter.get("/me", requireAuth, asyncHandler(me));
