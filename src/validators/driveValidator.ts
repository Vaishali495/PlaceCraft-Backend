import { z } from "zod";
import { DriveStatus, WorkMode } from "../utils/enums.js";

const eligibilitySchema = z.object({
  minCgpa: z.coerce.number().min(0).max(10).default(0),
  allowedCourses: z.array(z.string()).default([]),
  allowedFields: z.array(z.string()).default([]),
  maxBacklogsAllowed: z.coerce.number().min(0).default(0),
});

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

export type createDriveSchema = z.infer<typeof createDriveSchema>;

export const updateDriveSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Drive ID is required"),
  }),
  body: z
    .object({
      companyName: z.string().trim().min(2).optional(),
      roleTitle: z.string().trim().min(2).optional(),
      jobType: z.string().trim().optional(),
      location: z.string().trim().min(2).optional(),
      batchYear: z.coerce.number().min(2000).max(2040).optional(),
      ctcTotal: z.coerce.number().positive().optional(),
      eligibilityCriteria: eligibilitySchema.partial().optional(),
      requiredSkills: z.array(z.string()).optional(),
      registrationDeadline: z.string().min(1).optional(),
      description: z.string().trim().min(5).optional(),
      shiftTimings: z.string().trim().optional(),
      workMode: z.nativeEnum(WorkMode).optional(),
      status: z.nativeEnum(DriveStatus).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: "At least one field must be provided to update.",
    }),
});

export type updateDriveSchema = z.infer<typeof updateDriveSchema>;

export const deleteDriveSchema = z.object({
  params: z.object({
    id: z.string().trim().min(1, "Drive ID is required"),
  }),
});

export type deleteDriveSchema = z.infer<typeof deleteDriveSchema>;