import mongoose, { Schema, Document } from "mongoose";
import { ApplicationStatus } from "../utils/enums.js";
import type { IApplication } from "../types/index.js";

const applicationSchema = new Schema<IApplication>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    driveId: {
      type: Schema.Types.ObjectId,
      ref: "Drive",
      required: true,
    },
    appliedResumeUrl: {
      type: String,
      required: true,
      trim: true,
    },
    // currentStage: {
    //   type: Number,
    //   default: 1,
    //   min: 1,
    // },
    status: {
      type: String,
      enum: Object.values(ApplicationStatus),
      default: ApplicationStatus.APPLIED,
    },
    tpoRemarks: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true },
);

// Prevent duplicate applications by the same student for the same drive
applicationSchema.index({ studentId: 1, driveId: 1 }, { unique: true });

const Application = mongoose.model<IApplication>("Application", applicationSchema);
export default Application;