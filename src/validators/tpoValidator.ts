import { z } from "zod";
import { AcademicVerificationStatus } from "../utils/enums.js";

export const verifyStudentSchema = z.object({
  params: z.object({
    id: z
      .string()
      .trim()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid student profile ID"),
  }),
  body: z.object({
    status: z.enum(AcademicVerificationStatus),
  }),
});