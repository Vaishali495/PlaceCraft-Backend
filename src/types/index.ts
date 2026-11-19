import mongoose, { Document } from "mongoose";
import type {
  AcademicVerificationStatus,
  ApplicationStatus,
  BTechField,
  DriveStatus,
  SemesterStandingStatus,
  UserRole,
  WorkMode,
} from "../utils/enums.js";

export interface IUser {
  name: string;
  email: string;
  rollNumber?: string;
  passwordHash: string;
  role: UserRole;
  organization?: string;
  designation?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
}

export interface ISemesterRecord {
  semesterNumber: number;
  sgpa: number;
  status: SemesterStandingStatus;
}

export interface IStudentProfile {
  userId: mongoose.Types.ObjectId;
  studentId: string;
  course: string;
  field?: BTechField;
  graduationYear?: number;
  cgpa?: number;
  backlogCount: number;
  skills: string[];
  schooling?: {
    tenthPercentage?: number;
    tenthBoard?: string;
    twelfthPercentage?: number;
    twelfthBoard?: string;
  };
  semesterRecords?: ISemesterRecord[];
  academicVerification: {
    status: AcademicVerificationStatus;
    verifiedBy?: mongoose.Types.ObjectId | null;
    verifiedAt?: Date | null;
  };
  resume?: {
    url: string;
    publicId: string;
    updatedAt?: Date;
  } | null;
}

export interface CreateStudentAccountParams
  extends Pick<IUser, "name" | "email" | "passwordHash" | "emailVerificationToken" | "emailVerificationExpires">, Pick<IStudentProfile, "course"> {
  rollNumber: string;
}

export interface CreateTpoAccountParams extends Pick<
  IUser,
  "name" | "email" | "passwordHash" | "emailVerificationToken" | "emailVerificationExpires"
> {
  organization: string;
  designation: string;
}

// 3. Placement Drive Interfaces
export interface IDrive {
  companyName: string;
  roleTitle: string;
  jobType: string; // e.g. "Full Time + PPO"
  location: string;
  batchYear: number;
  ctcTotal: number; // in LPA (e.g. 44.0)
  eligibilityCriteria: {
    minCgpa: number;
    allowedCourses: string[];
    allowedFields: string[];
    maxBacklogsAllowed: number;
  };
  requiredSkills: string[];
  registrationDeadline: Date;
  description: string;
  shiftTimings?: string; // Optional exact hours e.g. "10:00 AM - 7:00 PM IST"
  workMode?: WorkMode;
  status: DriveStatus;
  createdBy: mongoose.Types.ObjectId;
}

export interface IApplication extends Document {
  studentId: mongoose.Types.ObjectId;
  driveId: mongoose.Types.ObjectId;
  appliedResumeUrl: string;
  // currentStage: number;
  status: ApplicationStatus;
  tpoRemarks?: string;
  createdAt: Date;
  updatedAt: Date;
}
