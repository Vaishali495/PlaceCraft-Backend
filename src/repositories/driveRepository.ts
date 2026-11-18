import mongoose from "mongoose";
import Drive from "../models/Drive.js";
import StudentProfile from "../models/StudentProfile.js";
import type { IDrive } from "../types/index.js";

export class DriveRepository {
  static async createDrive(driveData: Partial<IDrive>): Promise<IDrive> {
    return await Drive.create(driveData);
  }

  static async findDrives(filter: Record<string, unknown> = {}) {
    return await Drive.find(filter)
      .populate("createdBy", "name email organization designation")
      .sort({ createdAt: -1 })
      .lean();
  }

  static async findStudentProfileByUserId(userId: string | mongoose.Types.ObjectId) {
    return await StudentProfile.findOne({ userId }).lean();
  }
}