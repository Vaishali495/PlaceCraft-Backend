import type { Request, Response } from "express";
import mongoose from "mongoose";
import { DriveStatus, UserRole, WorkMode } from "../utils/enums.js";
import { DriveRepository } from "../repositories/driveRepository.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { sendSuccess } from "../utils/apiResponse.js";
import type { IDrive, IStudentProfile } from "../types/index.js";

const normalizeCourse = (value?: string): string =>
  (value || "").toLowerCase().replace(/[\s.-]/g, "").trim();

const evaluateDriveForStudent = (
  drive: IDrive & { _id: mongoose.Types.ObjectId },
  profile: IStudentProfile | null,
) => {
  const criteria = drive.eligibilityCriteria;

  const studentCgpa = profile?.cgpa ?? 0;
  const studentBacklogs = profile?.backlogCount ?? 0;
  const studentCourse = normalizeCourse(profile?.course);
  const studentField = (profile?.field || "").toLowerCase().trim();
  const studentBatch = profile?.graduationYear;
  const studentSkillsLower = (profile?.skills || []).map((s) => s.toLowerCase().trim());

  const cgpaMet = studentCgpa >= (criteria.minCgpa || 0);
  const backlogsMet = studentBacklogs <= (criteria.maxBacklogsAllowed ?? 0);

  const courseMet =
    !criteria.allowedCourses?.length ||
    criteria.allowedCourses.some((c) => normalizeCourse(c) === studentCourse);

  const fieldMet =
    !criteria.allowedFields?.length ||
    !studentField ||
    criteria.allowedFields.some((f) => f.toLowerCase().trim() === studentField);

  const batchMet = !drive.batchYear || !studentBatch || studentBatch <= drive.batchYear;

  const isEligible = Boolean(
    profile && cgpaMet && backlogsMet && courseMet && fieldMet && batchMet,
  );

  const reqSkills = drive.requiredSkills || [];
  const matchedSkills = reqSkills.filter((skill) =>
    studentSkillsLower.includes(skill.toLowerCase().trim()),
  );
  const missingSkills = reqSkills.filter(
    (skill) => !studentSkillsLower.includes(skill.toLowerCase().trim()),
  );
  const skillMatchPercent =
    reqSkills.length > 0 ? Math.round((matchedSkills.length / reqSkills.length) * 100) : 100;

  return {
    ...drive,
    isEligible,
    eligibilityChecks: {
      cgpaMet,
      courseMet,
      fieldMet,
      backlogsMet,
      batchMet,
    },
    matchedSkills,
    missingSkills,
    skillMatchPercent,
  };
};

export const getAllDrives = asyncHandler(async (req: Request, res: Response) => {
  const isTpo = req.user?.role === UserRole.TPO;
  const filter = isTpo ? {} : { status: DriveStatus.OPEN };

  const drives = await DriveRepository.findDrives(filter);

  if (isTpo) {
    return sendSuccess(res, 200, "Placement drives fetched successfully.", drives);
  }

  const userId = req.user?.id;
  const profile = userId ? await DriveRepository.findStudentProfileByUserId(userId) : null;

  const enrichedDrives = drives.map((drive) => evaluateDriveForStudent(drive, profile));

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