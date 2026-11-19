import { z } from "zod";

export const applyDriveSchema = z.object({
  driveId: z
    .string({ error: "Drive ID is required" })
    .trim()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid Drive ID format"),
});

export type ApplyDriveInput = z.infer<typeof applyDriveSchema>;