import { Router } from "express";
import { activity, summary } from "../controllers/dashboard.controller.js";
import { incomingClaims } from "../controllers/claim.controller.js";
import { myItems } from "../controllers/item.controller.js";
import { updateMe } from "../controllers/auth.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { itemQuerySchema, profileSchema } from "../validators/schemas.js";

export const userRouter = Router();
userRouter.use(requireAuth);
userRouter.get("/me/items", validateQuery(itemQuerySchema), asyncHandler(myItems));
userRouter.get("/me/incoming-claims", asyncHandler(incomingClaims));
userRouter.get("/me/activity", asyncHandler(activity));
userRouter.patch("/me", validateBody(profileSchema), asyncHandler(updateMe));

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);
dashboardRouter.get("/summary", asyncHandler(summary));
