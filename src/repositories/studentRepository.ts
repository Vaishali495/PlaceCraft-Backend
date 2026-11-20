import mongoose from "mongoose";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import type { IStudentProfile, IUser } from "../types/index.js";
import { AcademicVerificationStatus } from "../utils/enums.js";

export class StudentRepository {
  /**
   * Find student user account by user ID
   */
  static async findUserById(userId: string | mongoose.Types.ObjectId): Promise<IUser | null> {
    return await User.findById(userId).select("-passwordHash");
  }

  /**
   * Find Student Academic Profile populated with User details
   */
  static async findProfileByUserId(userId: string | mongoose.Types.ObjectId): Promise<IStudentProfile | null> {
    return await StudentProfile.findOne({ userId }).populate({
      path: "userId",
      select: "name email rollNumber role organization designation isEmailVerified",
    });
  }

  /**
   * Upsert / Update Student Academic Profile & Resume data
   */
  static async updateProfileByUserId(
    userId: string | mongoose.Types.ObjectId,
    updateData: Partial<IStudentProfile> | Record<string, unknown>,
  ): Promise<IStudentProfile | null> {
    return await StudentProfile.findOneAndUpdate({ userId }, { $set: updateData }, { returnDocument: "after", runValidators: true, upsert: true });
  }

  /**
   * Find Student Profile by its profile document _id
   */
  static async findProfileById(profileId: string) {
    return await StudentProfile.findById(profileId).lean();
  }

  /**
   * Find all student profiles with populated User info for TPO verification
   */
  static async findAllStudentsForTpo() {
    return await StudentProfile.find({}).populate("userId", "name email rollNumber role isEmailVerified").sort({ createdAt: -1 }).lean();
  }

  /**
   * Update academicVerification status for a student profile by profile _id
   */
  static async updateAcademicVerificationById(profileId: string, status: AcademicVerificationStatus, verifiedBy: string) {
    const isVerified = status === AcademicVerificationStatus.VERIFIED;

    return await StudentProfile.findByIdAndUpdate(
      profileId,
      {
        $set: {
          "academicVerification.status": status,
          "academicVerification.verifiedBy": isVerified ? verifiedBy : null,
          "academicVerification.verifiedAt": isVerified ? new Date() : null,
        },
      },
      { returnDocument: "after", runValidators: true },
    ).populate("userId", "name email rollNumber role isEmailVerified");
  }

  /**
   * Find all verified student profiles for TPO Directory Listing
   */
  //   static async findAllVerifiedStudents() {
  //     return await StudentProfile.find({ "academicVerification.status": "verified" }).populate("userId", "name email rollNumber").sort({ cgpa: -1 });
  //   }
}
