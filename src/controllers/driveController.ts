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

  const enrichedDrives = drives.map((drive) => evaluateDriveForStudent(drive, profile, appliedDriveIds));

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

export const updateDrive = asyncHandler(async (req: Request, res: Response) => {
  const driveId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!driveId || !mongoose.Types.ObjectId.isValid(driveId)) {
    throw new ApiError(400, "Invalid drive ID.");
  }

  const existingDrive = await DriveRepository.findDriveById(driveId);
  if (!existingDrive) {
    throw new ApiError(404, "Placement drive not found.");
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

  const updatePayload: Partial<IDrive> = {};

  if (companyName !== undefined) updatePayload.companyName = companyName.trim();
  if (roleTitle !== undefined) updatePayload.roleTitle = roleTitle.trim();
  if (jobType !== undefined) updatePayload.jobType = jobType.trim() || "Full Time";
  if (location !== undefined) updatePayload.location = location.trim();
  if (batchYear !== undefined) updatePayload.batchYear = Number(batchYear);
  if (ctcTotal !== undefined) updatePayload.ctcTotal = Number(ctcTotal);
  if (requiredSkills !== undefined) updatePayload.requiredSkills = requiredSkills;
  if (description !== undefined) updatePayload.description = description.trim();
  if (workMode !== undefined) updatePayload.workMode = workMode;
  if (status !== undefined) updatePayload.status = status;

  if (shiftTimings !== undefined) {
    updatePayload.shiftTimings = shiftTimings.trim();
  }

  if (registrationDeadline !== undefined) {
    const deadlineDate = new Date(registrationDeadline);
    if (Number.isNaN(deadlineDate.getTime())) {
      throw new ApiError(400, "Registration deadline must be a valid date.");
    }
    updatePayload.registrationDeadline = deadlineDate;
  }

  if (eligibilityCriteria !== undefined) {
    const currentCriteria = existingDrive.eligibilityCriteria || {
      minCgpa: 0,
      allowedCourses: [],
      allowedFields: [],
      maxBacklogsAllowed: 0,
    };

    updatePayload.eligibilityCriteria = {
      minCgpa: eligibilityCriteria.minCgpa !== undefined ? Number(eligibilityCriteria.minCgpa) : currentCriteria.minCgpa,
      maxBacklogsAllowed:
        eligibilityCriteria.maxBacklogsAllowed !== undefined ? Number(eligibilityCriteria.maxBacklogsAllowed) : currentCriteria.maxBacklogsAllowed,
      allowedCourses: eligibilityCriteria.allowedCourses !== undefined ? eligibilityCriteria.allowedCourses : currentCriteria.allowedCourses || [],
      allowedFields: eligibilityCriteria.allowedFields !== undefined ? eligibilityCriteria.allowedFields : currentCriteria.allowedFields || [],
    };
  }

  const updatedDrive = await DriveRepository.updateDriveById(driveId, updatePayload);

  return sendSuccess(res, 200, "Placement drive updated successfully.", updatedDrive);
});

export const deleteDrive = asyncHandler(async (req: Request, res: Response) => {
  const driveId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

  if (!driveId || !mongoose.Types.ObjectId.isValid(driveId)) {
    throw new ApiError(400, "Invalid drive ID.");
  }

  const deletedDrive = await DriveRepository.deleteDriveById(driveId);
  if (!deletedDrive) {
    throw new ApiError(404, "Placement drive not found.");
  }

  return sendSuccess(res, 200, "Placement drive deleted successfully.", { _id: deletedDrive._id });
});
