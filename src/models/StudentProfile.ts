import mongoose, { Schema } from "mongoose";

export interface IStudentProfile  {
  userId: mongoose.Types.ObjectId;
  studentId: string;
  course: string;
  graduationYear?: number;
  cgpa?: number;
  backlogCount: number;
  skills: string[];
  academicVerification: {
    status: "pending" | "verified" | "rejected";
    verifiedBy?: mongoose.Types.ObjectId | null;
    verifiedAt?: Date | null;
  };
  resume?: {
    url: string;
    publicId: string;
  } | null;
}

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
