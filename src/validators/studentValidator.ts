import { z } from "zod";
import { BTechField, SemesterStandingStatus } from "../utils/enums.js";

// Helper to parse JSON strings sent via FormData
const parseJsonField = (val: unknown) => {
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return val;
    }
  }
  return val;
};

// Helper to coerce FormData string numbers to actual numbers (Zod v4 syntax)
const optionalNumber = (min?: number, max?: number, label = "Value") =>
  z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      const num = Number(val);
      return Number.isNaN(num) ? val : num;
    },
    z
      .number({ error: `${label} must be a valid number` })
      .refine((n) => (min !== undefined ? n >= min : true), `${label} must be at least ${min}`)
      .refine((n) => (max !== undefined ? n <= max : true), `${label} cannot exceed ${max}`)
      .optional()
  );

// 1. Schema for GET /api/student/get-data
export const getStudentDataSchema = z.object({
  userId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid User ID format")
    .optional(),
});

// 2. Sub-schemas for Edit Profile
const schoolingSchema = z.object({
  tenthPercentage: optionalNumber(0, 100, "Class 10th percentage"),
  tenthBoard: z.string().trim().max(100, "Board name is too long").optional(),
  twelfthPercentage: optionalNumber(0, 100, "Class 12th percentage"),
  twelfthBoard: z.string().trim().max(100, "Board name is too long").optional(),
});

const semesterRecordSchema = z.object({
  semesterNumber: z
    .number({ error: "Semester number is required and must be a number" })
    .int("Semester number must be an integer")
    .min(1, "Semester must be at least 1")
    .max(12, "Semester cannot exceed 12"),
  sgpa: z
    .number({ error: "SGPA is required and must be a number" })
    .min(0, "SGPA cannot be less than 0")
    .max(10, "SGPA cannot exceed 10"),
  status: z.enum(SemesterStandingStatus).default(SemesterStandingStatus.CLEARED),
});

// 3. Schema for POST /api/student/edit-profile
export const editStudentProfileSchema = z.object({
  userId: z
    .string()
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid User ID format")
    .optional(),
  course: z.string().trim().min(2, "Course name is required"),
  field: z.enum(BTechField).optional(),
  graduationYear: optionalNumber(2000, 2035, "Graduation year"),
  cgpa: optionalNumber(0, 10, "CGPA"),
  backlogCount: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? 0 : Number(val)),
    z
      .number({ error: "Backlog count must be a valid number" })
      .int("Backlog count must be an integer")
      .min(0, "Backlog count cannot be negative")
  ),
  schooling: z.preprocess(parseJsonField, schoolingSchema.optional()),
  semesterRecords: z.preprocess(parseJsonField, z.array(semesterRecordSchema).optional()),
  skills: z.preprocess(
    parseJsonField,
    z.array(z.string().trim().min(1, "Skill cannot be empty")).optional()
  ),
});

export type GetStudentDataInput = z.infer<typeof getStudentDataSchema>;
export type EditStudentProfileInput = z.infer<typeof editStudentProfileSchema>;