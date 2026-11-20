import mongoose, { Schema } from "mongoose";
import { AcademicVerificationStatus, BTechField, SemesterStandingStatus } from "../utils/enums.js";
import type { ISemesterRecord, IStudentProfile } from "../types/index.js";

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
      // default: BTechField.CSE,
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
        enum: Object.values(AcademicVerificationStatus),
        default: AcademicVerificationStatus.PENDING,
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
