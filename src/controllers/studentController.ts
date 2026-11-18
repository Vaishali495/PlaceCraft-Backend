import fs from "fs";
import path from "path";
import type { Request, Response } from "express";
import { StudentRepository } from "../repositories/studentRepository.js";
import { UserRole } from "../utils/enums.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { sendSuccess } from "../utils/apiResponse.js";
import type { IStudentProfile } from "../types/index.js";

const parseJsonField = <T>(value: unknown, fieldName: string): T => {
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new ApiError(400, `Invalid JSON format in '${fieldName}'.`);
  }
};

export const getStudentData = asyncHandler(async (req: Request, res: Response) => {
  // Student can only access their own profile; TPO can query any student's userId
  const userId =
    req.user?.role === UserRole.TPO
      ? (req.query.userId as string) || req.user?.id
      : req.user?.id;

  if (!userId) {
    throw new ApiError(400, "User ID is missing.");
  }

  const studentProfile = await StudentRepository.findProfileByUserId(userId);
  if (!studentProfile) {
    throw new ApiError(404, "Student academic profile record not found.");
  }

  return sendSuccess(res, 200, "Student data fetched successfully.", studentProfile);
});

export const editStudentProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized. User ID is required to update student profile.");
  }

  const { course, field, graduationYear, cgpa, backlogCount, schooling, semesterRecords, skills } =
    req.body;

  const parsedSchooling = parseJsonField<IStudentProfile["schooling"]>(schooling, "schooling");
  const parsedSemesterRecords = parseJsonField<IStudentProfile["semesterRecords"]>(
    semesterRecords,
    "semesterRecords",
  );
  const parsedSkills = parseJsonField<string[]>(skills, "skills");

  const isBTech = course?.toLowerCase().replace(/\./g, "").trim() === "btech";

  const updatePayload: Record<string, unknown> = {
    course,
    field: isBTech ? field : undefined,
    graduationYear: graduationYear ? Number(graduationYear) : undefined,
    cgpa: cgpa !== undefined && cgpa !== "" ? Number(cgpa) : undefined,
    backlogCount: Number(backlogCount ?? 0),
    schooling: parsedSchooling,
    semesterRecords: parsedSemesterRecords,
    skills: parsedSkills,
  };

  if (req.file) {
    const existingProfile = await StudentRepository.findProfileByUserId(userId);
    if (existingProfile?.resume?.publicId) {
      const oldFilePath = path.join(
        process.cwd(),
        "uploads",
        "resumes",
        existingProfile.resume.publicId,
      );
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    updatePayload.resume = {
      url: `${baseUrl}/uploads/resumes/${req.file.filename}`,
      publicId: req.file.filename,
      updatedAt: new Date(),
    };
  }

  const updatedProfile = await StudentRepository.updateProfileByUserId(userId, updatePayload);

  return sendSuccess(res, 200, "Student profile updated successfully.", updatedProfile);
});