import mongoose, { Schema } from "mongoose";
import { BTechField, SemesterStandingStatus, type AcademicVerificationStatus } from "../utils/enums.js";

export interface ISemesterRecord {
  semesterNumber: number; // e.g., 1, 2, 3...
  sgpa: number;
  status: SemesterStandingStatus;
}

export interface IStudentProfile  {
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
    tenthBoard?: string; // e.g., "CBSE"
    twelfthPercentage?: number;
    twelfthBoard?: string;
  };

  semesterRecords?: ISemesterRecord[];

  academicVerification: {
    status:AcademicVerificationStatus;
    verifiedBy?: mongoose.Types.ObjectId | null;
    verifiedAt?: Date | null;
  };
  resume?: {
    url: string;
    publicId: string;
    updatedAt?: Date;
  } | null;
}

const semesterRecordSchema = new Schema<ISemesterRecord>(
  {
    semesterNumber: { type: Number, required: true },
    sgpa: { type: Number, required: true, min: 0, max: 10 },
    status: { type: String, enum: Object.values(SemesterStandingStatus), default: SemesterStandingStatus.CLEARED },
  },
  { _id: false }
);


const studentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    studentId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    course:{
        type: String,
        required: true,
        trim: true,
    },
    field:{
      type: String,
      enum: Object.values(BTechField),
      default: BTechField.CSE,
    },
    graduationYear: {
      type: Number,
      // required: true,
      min: 2000,
    },
    cgpa: {
      type: Number,
      // required: true,
      min: 0,
      max: 10,
    },
    backlogCount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    skills: {
      type: [String],
      default: [],
    },
    schooling: {
      tenthPercentage: { type: Number, min: 0, max: 100 },
      tenthBoard: { type: String, trim: true },
      twelfthPercentage: { type: Number, min: 0, max: 100 },
      twelfthBoard: { type: String, trim: true },
    },
    semesterRecords: {
      type: [semesterRecordSchema],
      default: [],
    },
    academicVerification: {
      status: {
        type: String,
        enum: ["pending", "verified", "rejected"],
        default: "pending",
      },
      verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
      verifiedAt: {
        type: Date,
        default: null,
      },
    },
    resume: {
      type: new Schema(
        {
          url: { type: String, required: true },
          publicId: { type: String, required: true },
        },
        { _id: false }
      ),
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const StudentProfile  = mongoose.model<IStudentProfile>("StudentProfile", studentProfileSchema);

export default StudentProfile;
