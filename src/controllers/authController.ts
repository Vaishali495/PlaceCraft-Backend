import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import type {
  EmailVerifyInput,
  LoginInput,
  ResendVerificationInput,
  StudentRegisterInput,
  TpoRegisterInput,
} from "../validators/authValidator.js";
import { generateEmailVerificationToken } from "../utils/emailVerificationToken.js";
import { sendVerificationEmail } from "../services/emailService.js";
import { UserRole } from "../utils/enums.js";
import { AuthRepository } from "../repositories/authRepository.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { sendSuccess } from "../utils/apiResponse.js";

const dispatchVerificationEmail = (email: string, token: string): void => {
  sendVerificationEmail(email, token).catch((emailError) => {
    console.error("Failed to send verification email:", emailError);
  });
};

export const registerStudent = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.role !== UserRole.STUDENT) {
    throw new ApiError(400, "Invalid role. This endpoint is only for student registration.");
  }

  const { name, email, rollNumber, password, course } = req.body as StudentRegisterInput;

  const normalizedEmail = email.toLowerCase().trim();
  const normalizedRollNumber = rollNumber.trim().toUpperCase();
  const passwordHash = await bcrypt.hash(password, 12);
  const { token, hashedToken, expiresAt } = generateEmailVerificationToken();

  const result = await AuthRepository.createStudentAccount({
    name,
    email: normalizedEmail,
    rollNumber: normalizedRollNumber,
    passwordHash,
    course,
    emailVerificationToken: hashedToken,
    emailVerificationExpires: expiresAt,
  });

  if (result.conflict) {
    throw new ApiError(409, "Email or roll number already registered.");
  }

  dispatchVerificationEmail(normalizedEmail, token);

  return sendSuccess(res, 201, "Registration successful. Please verify your email.", {
    user: {
      id: result.user._id,
      name: result.user.name,
      email: result.user.email,
      rollNumber: result.user.rollNumber,
      course: result.studentProfile.course,
      role: result.user.role,
    },
  });
});

export const registerTpo = asyncHandler(async (req: Request, res: Response) => {
  if (req.body.role !== UserRole.TPO) {
    throw new ApiError(400, "Invalid role. This endpoint is only for TPO registration.");
  }

  const { name, email, password, organization, designation } = req.body as TpoRegisterInput;
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await AuthRepository.findUserByEmail(normalizedEmail);
  if (existingUser) {
    throw new ApiError(409, "Email already registered.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const { token, hashedToken, expiresAt } = generateEmailVerificationToken();

  const user = await AuthRepository.createTpoAccount({
    name,
    email: normalizedEmail,
    passwordHash,
    organization,
    designation,
    emailVerificationToken: hashedToken,
    emailVerificationExpires: expiresAt,
  });

  dispatchVerificationEmail(normalizedEmail, token);

  return sendSuccess(res, 201, "Registration successful. Please verify your email.", {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      organization: user.organization,
      designation: user.designation,
      role: user.role,
    },
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.query as unknown as EmailVerifyInput;
  if (!token || typeof token !== "string") {
    throw new ApiError(400, "Verification token is required.");
  }

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const user = await AuthRepository.findUserByValidVerificationToken(hashedToken);

  if (!user) {
    throw new ApiError(
      400,
      "This verification link is invalid or has already been used. Please log in to check your email verification status. If your email is not verified, you can request a new verification email.",
    );
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = null;
  user.emailVerificationExpires = null;
  await AuthRepository.saveUser(user);

  return sendSuccess(res, 200, "Email verified successfully! You can now log in.");
});

export const resendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as ResendVerificationInput;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await AuthRepository.findUserByEmail(normalizedEmail, true);
  if (!user) {
    // Return 200 so attackers cannot enumerate registered emails
    return sendSuccess(
      res,
      200,
      "If an account exists with this email, a verification link has been sent.",
    );
  }

  if (user.isEmailVerified) {
    throw new ApiError(400, "This email is already verified.");
  }

  if (
    user.emailVerificationToken &&
    user.emailVerificationExpires &&
    user.emailVerificationExpires > new Date()
  ) {
    throw new ApiError(
      400,
      "Your current verification link is still valid. Please check your Gmail/inbox.",
    );
  }

  const { token, hashedToken, expiresAt } = generateEmailVerificationToken();
  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = expiresAt;
  await AuthRepository.saveUser(user);

  dispatchVerificationEmail(user.email, token);

  return sendSuccess(
    res,
    200,
    "If an account exists with this email, a verification link has been sent.",
  );
});

export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { identifier, password, activeTab } = req.body as LoginInput;
  const user = await AuthRepository.findUserForLogin(identifier.trim());

  if (!user) {
    throw new ApiError(401, "Invalid email/roll number or password.");
  }

  if (!user.isEmailVerified) {
    throw new ApiError(403, "Please verify your email address before logging in.");
  }

  if (activeTab) {
    const isRoleMismatch =
      (activeTab === UserRole.STUDENT && user.role !== UserRole.STUDENT) ||
      (activeTab === UserRole.TPO && user.role !== UserRole.TPO);

    if (isRoleMismatch) {
      throw new ApiError(
        403,
        `This account is registered as a ${user.role.toUpperCase()}. Please select the correct login tab.`,
      );
    }
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email/roll number or password.");
  }

  const course =
    user.role === UserRole.STUDENT ? await AuthRepository.getStudentCourse(user._id) : undefined;

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

  return sendSuccess(res, 200, "Login successful.", {
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      rollNumber: user.rollNumber,
      course,
      organization: user.organization,
      designation: user.designation,
    },
  });
});