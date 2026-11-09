
import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(72, "Password is too long")
  .regex(
    /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/,
    "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"
  );

const emailSchema = z.string().trim().email("Please enter a valid email address");

const commonFields = {
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
};

const studentSchema = z.object({
  ...commonFields,
  role: z.literal("student"),
  rollNumber: z.string().trim().min(1, "Roll number is required"),
  course: z.string().trim().min(1, "course is required"),
});

const tpoSchema = z.object({
  ...commonFields,
  role: z.literal("tpo"),
  organization: z.string().trim().min(1, "Organization is required"),
  designation: z.string().trim().min(1, "Designation is required"),
});

export const registerSchema = z
  .discriminatedUnion("role", [studentSchema, tpoSchema])
  .refine(
    (data) => data.password === data.confirmPassword,
    {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    }
  );

export const emailVerifySchema = z.object({
  token: z.string().trim().min(1, "Verification token is required"),
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

// Schema for POST /api/auth/login
export const loginSchema = z.object({
  identifier: z.string().trim().min(1, "Email or roll number is required"),
  password: z.string().min(1, "Password is required"),
  activeTab: z.enum(["student", "tpo"]).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type StudentRegisterInput = z.infer<typeof studentSchema>;
export type TpoRegisterInput = z.infer<typeof tpoSchema>;
export type EmailVerifyInput = z.infer<typeof emailVerifySchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;
