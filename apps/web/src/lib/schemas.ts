import { z } from "zod";
import { CATEGORIES } from "@/lib/constants";

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Enter your full name.").max(80),
    email: z.string().trim().email("Enter a valid email address."),
    studentId: z
      .string()
      .trim()
      .min(3, "Enter your student ID.")
      .max(32)
      .regex(/^[A-Za-z0-9-]+$/, "Use letters, numbers, and hyphens."),
    password: z.string().min(8, "Use at least 8 characters.").max(72),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export const reportSchema = z.object({
  title: z.string().trim().min(2, "Enter the item name.").max(120),
  type: z.enum(["lost", "found"]),
  category: z.enum(CATEGORIES),
  description: z.string().trim().min(10, "Add a short description.").max(2000),
  location: z.string().trim().min(2, "Enter a campus location.").max(120),
  eventDate: z.string().min(1, "Choose the date."),
  identifyingDetails: z.string().trim().max(500).optional(),
  contactPreference: z.enum(["in_app", "email"]),
  notes: z.string().trim().max(1000).optional(),
});

export const claimSchema = z.object({
  explanation: z.string().trim().min(10, "Explain why this item is yours.").max(1000),
  proofDescription: z.string().trim().max(1000).optional(),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
});

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;
export type ReportValues = z.infer<typeof reportSchema>;
export type ClaimValues = z.infer<typeof claimSchema>;
