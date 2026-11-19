import mongoose from "mongoose";
import Application from "../models/Application.js";
import type { IApplication } from "../types/index.js";

export class ApplicationRepository {
  /**
   * Check if student has already applied to a specific drive
   */
  static async findByStudentAndDrive(
    studentId: string | mongoose.Types.ObjectId,
    driveId: string | mongoose.Types.ObjectId,
  ) {
    return await Application.findOne({ studentId, driveId }).lean();
  }

  /**
   * Create a new drive application
   */
  static async createApplication(data: {
    studentId: string | mongoose.Types.ObjectId;
    driveId: string | mongoose.Types.ObjectId;
    appliedResumeUrl: string;
  }): Promise<IApplication> {
    return await Application.create(data);
  }

  /**
   * Get all applications of a student with populated drive details
   */
  static async findApplicationsByStudentId(studentId: string | mongoose.Types.ObjectId) {
    return await Application.find({ studentId })
      .populate(
        "driveId",
        "companyName roleTitle jobType location batchYear ctcTotal registrationDeadline workMode status",
      )
      .sort({ createdAt: -1 })
      .lean();
  }

  /**
   * Get all drive IDs applied by a student (used in getAllDrives to mark hasApplied)
   */
  static async findAppliedDriveIds(studentId: string | mongoose.Types.ObjectId): Promise<Set<string>> {
    const apps = await Application.find({ studentId }).select("driveId").lean();
    return new Set(apps.map((app) => String(app.driveId)));
  }
}