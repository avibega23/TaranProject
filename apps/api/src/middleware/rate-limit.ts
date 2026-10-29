import rateLimit from "express-rate-limit";
import { getEnv } from "../config/env.js";

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => getEnv().NODE_ENV === "test",
  message: {
    success: false,
    message: "Too many attempts. Try again later.",
    code: "RATE_LIMITED",
  },
});
