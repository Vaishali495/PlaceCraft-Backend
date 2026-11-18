import type { ClientSession } from "mongoose";
import User from "../models/User.js";
import mongoose from "mongoose";
import type { CreateStudentAccountParams, CreateTpoAccountParams, IStudentProfile, IUser } from "../types/index.js";
import { UserRole } from "../utils/enums.js";
import StudentProfile from "../models/StudentProfile.js";

export class AuthRepository {
  /**
   * Find user by email or roll number (supports optional transaction session)
   */
  static async findUserByEmailOrRollNumber(email: string, rollNumber: string, session?: ClientSession) {
    return await User.findOne({ $or: [{ email }, { rollNumber }] }, null, session ? { session } : undefined);
  }

  /**
   * Find user by email
   */
  static async findUserByEmail(email: string, includeVerificationFields = false) {
    const query = User.findOne({ email });
    if (includeVerificationFields) {
      query.select("+emailVerificationToken +emailVerificationExpires");
    }
    return await query;
  }

  /**
   * Atomically create a Student User + StudentProfile with verification token
   */
  static async createStudentAccount(params: CreateStudentAccountParams) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { course, ...userFields } = params;

      const existingUser = await this.findUserByEmailOrRollNumber(params.email, params.rollNumber, session);

      if (existingUser) {
        await session.abortTransaction();
        session.endSession();
        return { conflict: true as const };
      }

      const userPayload = {
        ...userFields,
        role: UserRole.STUDENT,
      };
      const [user] = await User.create([userPayload], { session });

      if (!user) {
        throw new Error("Failed to create user document.");
      }

      const studentPayload = {
        userId: user._id,
        studentId: params.rollNumber,
        course,
      };
      const [studentProfile] = await StudentProfile.create([studentPayload], { session });

      if (!studentProfile) {
        throw new Error("Failed to create student profile document.");
      }

      await session.commitTransaction();
      session.endSession();

      return { conflict: false as const, user, studentProfile };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      session.endSession();
      throw error;
    }
  }

  /**
   * Create a TPO User with verification token
   */
  static async createTpoAccount(params: CreateTpoAccountParams) {
    return await User.create({
      ...params,
      role: UserRole.TPO,
    });
  }

  /**
   * Find user by valid (unexpired) hashed verification token
   */
  static async findUserByValidVerificationToken(hashedToken: string) {
    return await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select("+emailVerificationToken +emailVerificationExpires");
  }

  /**
   * Save changes on a User document
   */
  static async saveUser(user: mongoose.HydratedDocument<IUser>) {
    return await user.save();
  }

  /**
   * Find user by email or roll number for login (includes passwordHash)
   */
  static async findUserForLogin(identifier: string) {
    const isEmail = identifier.includes("@");
    const filter = isEmail ? { email: identifier.toLowerCase() } : { rollNumber: identifier.toUpperCase() };

    return await User.findOne(filter).select("+passwordHash");
  }

  /**
   * Fetch student's course by userId (used during login response building)
   */
  static async getStudentCourse(userId: mongoose.Types.ObjectId): Promise<string | undefined> {
    const profile: Pick<IStudentProfile, "course"> | null = await StudentProfile.findOne({
      userId,
    })
      .select("course")
      .lean();
    return profile?.course;
  }
}
