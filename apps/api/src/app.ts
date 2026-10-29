import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { getEnv } from "./config/env.js";
import { errorHandler } from "./middleware/error-handler.js";
import { adminRouter } from "./routes/admin.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { claimRouter } from "./routes/claim.routes.js";
import { dashboardRouter, userRouter } from "./routes/user.routes.js";
import { healthRouter } from "./routes/health.routes.js";
import { itemRouter } from "./routes/item.routes.js";
import { uploadRouter } from "./routes/upload.routes.js";

export function createApp() {
  const env = getEnv();
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false, limit: "1mb" }));
  app.use(cookieParser());

  app.use("/api/health", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/items", itemRouter);
  app.use("/api/claims", claimRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/users", userRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/uploads", uploadRouter);

  app.use("/api", (_req, res) => {
    res.status(404).json({ success: false, message: "That API route does not exist.", code: "NOT_FOUND" });
  });

  app.use(errorHandler);
  return app;
}
