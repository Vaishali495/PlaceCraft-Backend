import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import type { Request, Response } from "express";
import User from "../models/User.js";
import StudentProfile from "../models/StudentProfile.js";
import type { LoginInput } from "../validators/authValidator.js";

// @desc    Authenticate User & get JWT Token
// @route   POST /api/auth/login
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { identifier, password, activeTab } = req.body as LoginInput;

    const normalizedIdentifier = identifier.trim();
    const isEmail = normalizedIdentifier.includes("@");

    // 1. Find user by lowercased email OR uppercased rollNumber
    const query = isEmail
      ? { email: normalizedIdentifier.toLowerCase() }
      : { rollNumber: normalizedIdentifier.toUpperCase() };

    // Explicitly include passwordHash since select: false in User Schema
    const user = await User.findOne(query).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/roll number or password.",
      });
    }

    // 2. Validate email verification status
    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email address before logging in.",
      });
    }

    // 3. Optional Role Match check (prevents student logging in on TPO tab)
    if (activeTab) {
      const isRoleMismatch =
        (activeTab === "student" && user.role !== "student") ||
        ((activeTab === "tpo" || activeTab === "recruiter") && user.role !== "tpo");

      if (isRoleMismatch) {
        return res.status(403).json({
          success: false,
          message: `This account is registered as a ${user.role.toUpperCase()}. Please select the correct login tab.`,
        });
      }
    }

    // 4. Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email/roll number or password.",
      });
    }

    // 5. Fetch student profile details if role is student
    let department: string | undefined;
    if (user.role === "student") {
      const studentProfile = await StudentProfile.findOne({ userId: user._id });
      department = studentProfile?.department;
    }

    // 6. Generate JWT Token
    const jwtSecret = process.env.JWT_SECRET || "placecraft_fallback_secret_key";
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        email: user.email,
      },
      jwtSecret,
      { expiresIn: "7d" }
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