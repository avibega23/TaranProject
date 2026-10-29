import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getEnv } from "../config/env.js";
import { AppError } from "../utils/errors.js";
import { createUploadName } from "../utils/tokens.js";

type ImageKind = { mime: "image/jpeg" | "image/png" | "image/webp"; extension: "jpg" | "png" | "webp" };

export function detectImage(buffer: Buffer, declaredMime: string): ImageKind {
  const mime = declaredMime.toLowerCase();
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    if (mime !== "image/jpeg" && mime !== "image/jpg") {
      throw new AppError(400, "VALIDATION_ERROR", "The file content does not match a JPEG image.");
    }
    return { mime: "image/jpeg", extension: "jpg" };
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    if (mime !== "image/png") {
      throw new AppError(400, "VALIDATION_ERROR", "The file content does not match a PNG image.");
    }
    return { mime: "image/png", extension: "png" };
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    if (mime !== "image/webp") {
      throw new AppError(400, "VALIDATION_ERROR", "The file content does not match a WebP image.");
    }
    return { mime: "image/webp", extension: "webp" };
  }
  throw new AppError(400, "VALIDATION_ERROR", "Upload a JPEG, PNG, or WebP image.");
}

export async function saveItemImage(file: Express.Multer.File): Promise<string> {
  if (!file.buffer?.length) {
    throw new AppError(400, "VALIDATION_ERROR", "The image file was empty.");
  }
  const kind = detectImage(file.buffer, file.mimetype);
  const filename = createUploadName(kind.extension);
  const directory = path.resolve(process.cwd(), getEnv().UPLOAD_DIR);
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, filename), file.buffer);
  return filename;
}

export function resolveUploadPath(filename: string): string | null {
  if (!/^[a-f0-9]{32}\.(jpg|png|webp)$/i.test(filename)) return null;
  const directory = path.resolve(process.cwd(), getEnv().UPLOAD_DIR);
  const full = path.resolve(directory, filename);
  if (!full.startsWith(directory + path.sep)) return null;
  return full;
}
