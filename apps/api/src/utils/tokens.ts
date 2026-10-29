import { createHash, randomBytes } from "node:crypto";

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function createUploadName(extension: "jpg" | "png" | "webp"): string {
  return `${randomBytes(16).toString("hex")}.${extension}`;
}
