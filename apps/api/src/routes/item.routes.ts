import { Router } from "express";
import multer from "multer";
import { getEnv } from "../config/env.js";
import {
  getItem,
  itemMatches,
  itemStats,
  listItems,
  patchItem,
  postItem,
  removeItem,
} from "../controllers/item.controller.js";
import { postClaim } from "../controllers/claim.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { validateBody, validateParams, validateQuery } from "../middleware/validate.js";
import { claimSchema, idParamSchema, itemQuerySchema, itemSchema, itemUpdateSchema } from "../validators/schemas.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getEnv().MAX_UPLOAD_BYTES, files: 1 },
}).single("image");

export const itemRouter = Router();

itemRouter.get("/stats", asyncHandler(itemStats));
itemRouter.get("/", optionalAuth, validateQuery(itemQuerySchema), asyncHandler(listItems));
itemRouter.post("/", requireAuth, upload, validateBody(itemSchema), asyncHandler(postItem));
itemRouter.get("/:id/matches", optionalAuth, validateParams(idParamSchema), asyncHandler(itemMatches));
itemRouter.post(
  "/:id/claims",
  requireAuth,
  validateParams(idParamSchema),
  validateBody(claimSchema),
  asyncHandler(postClaim),
);
itemRouter.get("/:id", optionalAuth, validateParams(idParamSchema), asyncHandler(getItem));
itemRouter.patch(
  "/:id",
  requireAuth,
  upload,
  validateParams(idParamSchema),
  validateBody(itemUpdateSchema),
  asyncHandler(patchItem),
);
itemRouter.delete("/:id", requireAuth, validateParams(idParamSchema), asyncHandler(removeItem));
