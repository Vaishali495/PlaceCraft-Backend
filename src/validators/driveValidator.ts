import { z } from "zod";
import { DriveStatus, WorkMode } from "../utils/enums.js";

export const createDriveSchema = z.object({
  companyName: z.string().trim().min(2, "Company name is required"),
  roleTitle: z.string().trim().min(2, "Role title is required"),
  jobType: z.string().trim().optional(),
  location: z.string().trim().min(2, "Location is required"),
  batchYear: z.coerce.number().int().min(2020).max(2035),
  ctcTotal: z.coerce.number().positive("CTC must be greater than 0"),
  eligibilityCriteria: z
    .object({
      minCgpa: z.coerce.number().min(0).max(10).default(0),
      allowedCourses: z.array(z.string().trim()).default([]),
      allowedFields: z.array(z.string().trim()).default([]),
      maxBacklogsAllowed: z.coerce.number().int().min(0).default(0),
    })
    .default({
      minCgpa: 0,
      allowedCourses: [],
      allowedFields: [],
      maxBacklogsAllowed: 0,
    }),
  requiredSkills: z.array(z.string().trim()).default([]),
  registrationDeadline: z.string().min(1, "Registration deadline is required"),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  shiftTimings: z.string().trim().optional(),
  workMode: z.nativeEnum(WorkMode).optional(),
  status: z.nativeEnum(DriveStatus).optional(),
});

export type CreateDriveInput = z.infer<typeof createDriveSchema>;