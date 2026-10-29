import { Router } from "express";
import { adminClaims, adminItems, history, moderate } from "../controllers/admin.controller.js";
import { overview } from "../controllers/dashboard.controller.js";
import { review } from "../controllers/claim.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.js";
import { idParamSchema, itemQuerySchema, moderationSchema, reviewSchema } from "../validators/schemas.js";
import { z } from "zod";

const historyParams = z.object({
  resourceType: z.enum(["item", "claim", "user"]),
  id: z.string().regex(/^[a-f\d]{24}$/i),
});

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole("admin"));
adminRouter.get("/overview", asyncHandler(overview));
adminRouter.get("/items", validateQuery(itemQuerySchema), asyncHandler(adminItems));
adminRouter.patch(
  "/items/:id/moderation",
  validateParams(idParamSchema),
  validateBody(moderationSchema),
  asyncHandler(moderate),
);
adminRouter.get("/claims", asyncHandler(adminClaims));
adminRouter.patch(
  "/claims/:id/review",
  validateParams(idParamSchema),
  validateBody(reviewSchema),
  asyncHandler(review),
);
adminRouter.get("/history/:resourceType/:id", validateParams(historyParams), asyncHandler(history));
