import type mongoose from "mongoose";
import User, { type IUser } from "../models/User.js";
import StudentProfile, { type IStudentProfile } from "../models/StudentProfile.js";

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
    updateData: Partial<IStudentProfile>,
  ): Promise<IStudentProfile | null> {
    return await StudentProfile.findOneAndUpdate({ userId }, { $set: updateData }, { new: true, runValidators: true, upsert: true });
  }

  /**
   * Find all verified student profiles for TPO Directory Listing
   */
//   static async findAllVerifiedStudents() {
//     return await StudentProfile.find({ "academicVerification.status": "verified" }).populate("userId", "name email rollNumber").sort({ cgpa: -1 });
//   }
}
