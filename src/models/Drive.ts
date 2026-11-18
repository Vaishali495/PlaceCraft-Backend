import mongoose, { Schema, Document } from "mongoose";
import { DriveStatus, WorkMode } from "../utils/enums.js";
import type { IDrive } from "../types/index.js";

const driveSchema = new Schema<IDrive>(
  {
    companyName: { type: String, required: true, trim: true },
    roleTitle: { type: String, required: true, trim: true },
    jobType: { type: String, default: "Full Time" },
    location: { type: String, required: true, trim: true },
    batchYear: { type: Number, required: true },
    ctcTotal: { type: Number, required: true },
    eligibilityCriteria: {
      minCgpa: { type: Number, default: 0 },
      allowedCourses: [{ type: String }],
      allowedFields: [{ type: String }],
      maxBacklogsAllowed: { type: Number, default: 0 },
    },
    requiredSkills: [{ type: String }],
    registrationDeadline: { type: Date, required: true },
    description: { type: String, required: true },
    shiftTimings: String,
    workMode: {
      type: String,
      enum: Object.values(WorkMode),
      default: WorkMode.ON_SITE,
    },
    status: {
      type: String,
      enum: Object.values(DriveStatus),
      default: DriveStatus.OPEN,
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const Drive = mongoose.model<IDrive>("Drive", driveSchema);
export default Drive;
