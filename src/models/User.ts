import mongoose, { Schema } from "mongoose";
import { UserRole } from "../utils/enums.js";

export interface IUser {
  name: string;
  email: string;
  rollNumber?: string;
  passwordHash: string;
  role: UserRole;
  organization?: string;
  designation?: string;
  // isActive: boolean;
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpires?: Date | null;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      trim: true,
      uppercase: true,
      unique: true,
      sparse: true,
    },
    passwordHash: {
      type: String,
      required: true,
      // Excludes the password hash from query results by default for security.
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.STUDENT,
      required: true,
    },
    organization: {
      type: String,
      trim: true,
    },
    designation: {
      type: String,
      trim: true,
    },
    // isActive: {
    //   type: Boolean,
    //   default: false,
    // },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model<IUser>("User", userSchema);

export default User;
