import { Router } from "express";
import { showUpload } from "../controllers/upload.controller.js";
import { asyncHandler } from "../utils/async-handler.js";
import { optionalAuth } from "../middleware/auth.js";
import { validateParams } from "../middleware/validate.js";
import { filenameParamSchema } from "../validators/schemas.js";

export const uploadRouter = Router();
uploadRouter.get("/:filename", optionalAuth, validateParams(filenameParamSchema), asyncHandler(showUpload));
