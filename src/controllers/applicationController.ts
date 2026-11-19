import type { Request, Response } from "express";
import { ApplicationRepository } from "../repositories/applicationRepository.js";
import { DriveRepository } from "../repositories/driveRepository.js";
import { StudentRepository } from "../repositories/studentRepository.js";
import { DriveStatus } from "../utils/enums.js";
import { evaluateDriveForStudent } from "../utils/helper.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";

export const applyToDrive = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.user?.id;
  if (!studentId) {
    throw new ApiError(401, "Unauthorized. Student ID is missing.");
  }

  const { driveId } = req.body;

  // 1. Verify Drive exists, is Open, and deadline has not passed
  const drive = await DriveRepository.findDriveById(driveId);
  if (!drive) {
    throw new ApiError(404, "Placement drive not found.");
  }

  if (drive.status !== DriveStatus.OPEN || new Date(drive.registrationDeadline) <= new Date()) {
    throw new ApiError(400, "Registrations for this drive are closed.");
  }

  // 2. Prevent duplicate application
  const existingApplication = await ApplicationRepository.findByStudentAndDrive(studentId, driveId);
  if (existingApplication) {
    throw new ApiError(409, "You have already applied for this placement drive.");
  }

  // 3. Verify Student Profile & Uploaded Resume
  const profile = await StudentRepository.findProfileByUserId(studentId);
  if (!profile) {
    throw new ApiError(404, "Please complete your student academic profile before applying.");
  }

  if (!profile.resume?.url) {
    throw new ApiError(400, "Please upload your resume in your profile before applying.");
  }

  // 4. Reuse shared eligibility evaluation helper
  const { isEligible } = evaluateDriveForStudent(drive, profile);
  if (!isEligible) {
    throw new ApiError(403, "You do not meet the eligibility criteria for this placement drive.");
  }

  // 5. Create Application
  const application = await ApplicationRepository.createApplication({
    studentId,
    driveId,
    appliedResumeUrl: profile.resume.url,
  });

  return sendSuccess(res, 201, "Successfully applied to the placement drive.", application);
});

export const getMyApplications = asyncHandler(async (req: Request, res: Response) => {
  const studentId = req.user?.id;
  if (!studentId) {
    throw new ApiError(401, "Unauthorized. Student ID is missing.");
  }

  const applications = await ApplicationRepository.findApplicationsByStudentId(studentId);

  return sendSuccess(res, 200, "Applications fetched successfully.", applications);
});