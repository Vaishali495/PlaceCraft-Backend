import type { Request, Response } from "express";
import mongoose from "mongoose";
import { DriveStatus, UserRole, WorkMode } from "../utils/enums.js";
import { DriveRepository } from "../repositories/driveRepository.js";
import { ApplicationRepository } from "../repositories/applicationRepository.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { sendSuccess } from "../utils/apiResponse.js";
import type { IDrive } from "../types/index.js";
import { evaluateDriveForStudent } from "../utils/helper.js";

export const getAllDrives = asyncHandler(async (req: Request, res: Response) => {
  const isTpo = req.user?.role === UserRole.TPO;
  const filter = isTpo ? {} : { status: DriveStatus.OPEN };

  const drives = await DriveRepository.findDrives(filter);

  if (isTpo) {
    return sendSuccess(res, 200, "Placement drives fetched successfully.", drives);
  }

  const userId = req.user?.id;
  const [profile, appliedDriveIds] = await Promise.all([
    userId ? DriveRepository.findStudentProfileByUserId(userId) : Promise.resolve(null),
    userId ? ApplicationRepository.findAppliedDriveIds(userId) : Promise.resolve(new Set<string>()),
  ]);

  const enrichedDrives = drives.map((drive) =>
    evaluateDriveForStudent(drive, profile, appliedDriveIds),
  );

  return sendSuccess(res, 200, "Placement drives fetched successfully.", enrichedDrives);
});

export const createDrive = asyncHandler(async (req: Request, res: Response) => {
  const tpoId = req.user?.id;
  if (!tpoId) {
    throw new ApiError(401, "Unauthorized. TPO user ID is missing.");
  }

  const {
    companyName,
    roleTitle,
    jobType,
    location,
    batchYear,
    ctcTotal,
    eligibilityCriteria,
    requiredSkills,
    registrationDeadline,
    description,
    shiftTimings,
    workMode,
    status,
  } = req.body;

  const deadlineDate = new Date(registrationDeadline);
  if (Number.isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
    throw new ApiError(400, "Registration deadline must be a valid future date.");
  }

  const drivePayload: Partial<IDrive> = {
    companyName: companyName.trim(),
    roleTitle: roleTitle.trim(),
    jobType: jobType?.trim() || "Full Time",
    location: location.trim(),
    batchYear: Number(batchYear),
    ctcTotal: Number(ctcTotal),
    eligibilityCriteria: {
      minCgpa: Number(eligibilityCriteria?.minCgpa ?? 0),
      allowedCourses: eligibilityCriteria?.allowedCourses ?? [],
      allowedFields: eligibilityCriteria?.allowedFields ?? [],
      maxBacklogsAllowed: Number(eligibilityCriteria?.maxBacklogsAllowed ?? 0),
    },
    requiredSkills: requiredSkills ?? [],
    registrationDeadline: deadlineDate,
    description: description.trim(),
    ...(shiftTimings?.trim() ? { shiftTimings: shiftTimings.trim() } : {}),
    workMode: workMode || WorkMode.ON_SITE,
    status: status || DriveStatus.OPEN,
    createdBy: new mongoose.Types.ObjectId(tpoId),
  };

  const createdDrive = await DriveRepository.createDrive(drivePayload);

  return sendSuccess(res, 201, "Placement drive created successfully.", createdDrive);
});