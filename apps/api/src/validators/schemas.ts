import { z } from "zod";
import { CATEGORIES, CONTACT_PREFERENCES, ITEM_TYPES } from "../config/constants.js";

const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use at most 72 characters.");

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(80),
    email: z.string().trim().email("Enter a valid email address.").max(160),
    studentId: z
      .string()
      .trim()
      .min(3, "Enter your student ID.")
      .max(32)
      .regex(/^[A-Za-z0-9-]+$/, "Student ID can use letters, numbers, and hyphens."),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password.").max(72),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
}).strict();

const eventDate = z.coerce.date().refine((date) => {
  const now = Date.now();
  const twoYears = 1000 * 60 * 60 * 24 * 365 * 2;
  return date.getTime() <= now + 1000 * 60 * 60 * 24 && date.getTime() >= now - twoYears;
}, "Choose a date within the last two years, and not in the future.");

export const itemSchema = z.object({
  title: z.string().trim().min(2, "Enter the item name.").max(120),
  description: z.string().trim().min(10, "Add a short description.").max(2000),
  type: z.enum(ITEM_TYPES),
  category: z.enum(CATEGORIES),
  location: z.string().trim().min(2, "Enter where it was lost or found.").max(120),
  eventDate,
  identifyingDetails: z.string().trim().max(500).optional().default(""),
  contactPreference: z.enum(CONTACT_PREFERENCES).default("in_app"),
  notes: z.string().trim().max(1000).optional().default(""),
});

export const itemUpdateSchema = itemSchema.partial();

export const claimSchema = z.object({
  explanation: z.string().trim().min(10, "Explain why this item is yours.").max(1000),
  proofDescription: z.string().trim().max(1000).optional().default(""),
});

export const reviewSchema = z.object({
  decision: z.enum(["approve", "reject"]),
  note: z.string().trim().max(500).optional(),
});

export const moderationSchema = z.object({
  action: z.enum(["approve", "reject", "archive", "resolve"]),
  note: z.string().trim().max(500).optional(),
});

export const itemQuerySchema = z.object({
  q: z.string().trim().max(100).optional(),
  type: z.enum(ITEM_TYPES).optional(),
  category: z.enum(CATEGORIES).optional(),
  location: z.string().trim().max(120).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  status: z.enum(["pending", "approved", "rejected", "resolved", "archived"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export const idParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id."),
});

export const filenameParamSchema = z.object({
  filename: z.string().regex(/^[a-f0-9]{32}\.(jpg|png|webp)$/i, "Invalid file."),
});
