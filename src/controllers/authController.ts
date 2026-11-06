import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import User from "../models/User.js";
import type { EmailVerifyInput, LoginInput, ResendVerificationInput, StudentRegisterInput, TpoRegisterInput } from "../validators/authValidator.js";
import StudentProfile from "../models/StudentProfile.js";
import { generateEmailVerificationToken } from "../utils/emailVerificationToken.js";
import { sendVerificationEmail } from "../services/emailService.js";
import jwt from "jsonwebtoken";

import mongoose from "mongoose";

export const registerStudent = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, rollNumber, password, role, department } = req.body as StudentRegisterInput;

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedRollNumber = rollNumber.trim().toUpperCase();

    // Check for existing user inside transaction session
    const existingUser = await User.findOne(
      {
        $or: [{ email: normalizedEmail }, { rollNumber: normalizedRollNumber }],
      },
      null,
      { session },
    );

    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        message: "Email or roll number already registered.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userData = {
      name,
      email: normalizedEmail,
      rollNumber: normalizedRollNumber,
      passwordHash,
      role,
    };

    // Create User document inside transaction (returns array)
    const [user] = await User.create([userData], { session });
    if (!user) {
      throw new Error("Failed to create user document.");
    }

    //Create student profile document inside transaction
    const studentProfileData = {
      userId: user._id,
      studentId: normalizedRollNumber,
      department: department,
    };
    const [studentProfile] = await StudentProfile.create([studentProfileData], { session });

    if (!studentProfile) {
      throw new Error("Failed to create student profile document.");
    }

    //Generate token for email verification
    const { token, hashedToken, expiresAt } = generateEmailVerificationToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = expiresAt;

    await user.save({ session });

    await session.commitTransaction();
    session.endSession();

    await sendVerificationEmail(email, token);

    const resData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        rollNumber: user.rollNumber,
        department: studentProfile?.department,
        role: user.role,
      },
    };

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      data: resData,
    });
  } catch (error) {
    // Clean up transaction session on failure
    await session.abortTransaction();
    session.endSession();

    console.error("Registration error:", error);
    // Handle duplicate key errors
    if ((error as { code?: number }).code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or roll number already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const registerTpo = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, organization, designation } = req.body as TpoRegisterInput;

    const normalizedEmail = email.toLowerCase().trim();

    // Check for existing user
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const userData = {
      name,
      email: normalizedEmail,
      passwordHash,
      organization,
      designation,
      role,
    };

    const user = await User.create(userData);

    //Generate token for email verification
    const { token, hashedToken, expiresAt } = generateEmailVerificationToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = expiresAt;

    await user.save();

    await sendVerificationEmail(email, token);

    const resData = {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        organization,
        designation,
        role: user.role,
      },
    };

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      data: resData,
    });
  } catch (error) {
    console.error("Registration error:", error);

    if ((error as { code?: number }).code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.query as EmailVerifyInput;

    if (!token || typeof token !== "string") {
      return res.status(400).json({
        success: false,
        message: "Verification token is required.",
      });
    }

    // Hash the incoming raw token to match the database stored token
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token.",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Email verified successfully! You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const { email } = req.body as ResendVerificationInput;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Return 200 for security so attackers can't enumerate valid emails
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a verification link has been sent(not found).",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "This email is already verified.",
      });
    }

    // Generate new token & expiration
    const { token, hashedToken, expiresAt } = generateEmailVerificationToken();
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = expiresAt;

    await user.save();

    sendVerificationEmail(user.email, token);
    console.log("resend verification token sent: ", token);

    return res.status(200).json({
      success: true,
      message: "If an account exists with this email, a verification link has been sent.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { identifier, password, activeTab } = req.body as LoginInput;

    const normalizedIdentifier = identifier.trim();
    const isEmail = normalizedIdentifier.includes("@");

    const query = isEmail ? { email: normalizedIdentifier.toLowerCase() } : { rollNumber: normalizedIdentifier.toUpperCase() };

    const user = await User.findOne(query).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/roll number or password.",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address before logging in.",
      });
    }

    if (activeTab) {
      const isRoleMismatch = (activeTab === "student" && user.role !== "student") || (activeTab === "tpo" && user.role !== "tpo");

      if (isRoleMismatch) {
        return res.status(403).json({
          success: false,
          message: `This account is registered as a ${user.role.toUpperCase()}. Please select the correct login tab.`,
        });
      }
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/roll number or password.",
      });
    }

    let department: string | undefined;
    if (user.role === "student") {
      const studentProfile = await StudentProfile.findOne({ userId: user._id });
      department = studentProfile?.department;
    }

    const jwtSecret = process.env.JWT_SECRET || "placecraft_fallback_secret_key";
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: "7d" },
    );

    const resData = {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        rollNumber: user.rollNumber,
        department: department,
        organization: user.organization,
        designation: user.designation,
      },
    };

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: resData,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
    });
  }
};
