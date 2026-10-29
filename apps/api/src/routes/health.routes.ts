import { Router } from "express";
import { health } from "../controllers/dashboard.controller.js";
import { asyncHandler } from "../utils/async-handler.js";

export const healthRouter = Router();
healthRouter.get("/", asyncHandler(health));
