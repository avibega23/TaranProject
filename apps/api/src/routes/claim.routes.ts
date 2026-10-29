import { Router } from "express";
import { cancel, getClaim, myClaims, review } from "../controllers/claim.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody, validateParams } from "../middleware/validate.js";
import { idParamSchema, reviewSchema } from "../validators/schemas.js";

export const claimRouter = Router();

claimRouter.use(requireAuth);
claimRouter.get("/mine", asyncHandler(myClaims));
claimRouter.get("/:id", validateParams(idParamSchema), asyncHandler(getClaim));
claimRouter.patch("/:id/cancel", validateParams(idParamSchema), asyncHandler(cancel));
claimRouter.patch("/:id/review", validateParams(idParamSchema), validateBody(reviewSchema), asyncHandler(review));
