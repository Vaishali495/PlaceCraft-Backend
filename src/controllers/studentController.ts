import fs from "fs";
import path from "path";
import type { Request, Response } from "express";
import { StudentRepository } from "../repositories/studentRepository.js";

export const getStudentData = async (req: Request, res: Response) => {
  try {
    console.log("in get student data");
    // const userId = req.query.userId;
    const userId = (req as any).user?.id || (req.query.userId as string);

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is missing.",
      });
    }

    const studentProfile = await StudentRepository.findProfileByUserId(userId);

    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: "Student academic profile record not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Student data fetched successfully.",
      data: studentProfile,
    });
  } catch (error) {
    console.error("Error fetching student profile:", error);
    return res.status(500).json({ success: false, message: "Internal server error while fetching student data." });
  }
};

export const editStudentProfile = async (req: Request, res: Response) => {
  try {
    console.log("am in edit student profile");
    console.log("req.body: ",req.body);
    console.log("req.file: ",req.file);
    const userId = (req as any).user?.id || req.body.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required to update student profile.",
      });
    }

    // Extract payload sent by EditProfileModal
    const { course, field, graduationYear, cgpa, backlogCount, schooling, semesterRecords, skills } = req.body;

    const parsedSchooling = typeof schooling === "string" ? JSON.parse(schooling) : schooling;
    const parsedSemesterRecords = typeof semesterRecords === "string" ? JSON.parse(semesterRecords) : semesterRecords;
    const parsedSkills = typeof skills === "string" ? JSON.parse(skills) : skills;

    const updatePayload: any = {
      course,
      field,
      graduationYear: graduationYear ? Number(graduationYear) : undefined,
      cgpa: cgpa !== undefined && cgpa !== "" ? Number(cgpa) : undefined,
      backlogCount: Number(backlogCount ?? 0),
      schooling: parsedSchooling,
      semesterRecords: parsedSemesterRecords,
      skills: parsedSkills,
    };

    if (req.file) {
      // Purani file delete karne ke liye (optional cleanup)
      const existingProfile = await StudentRepository.findProfileByUserId(userId);
      if (existingProfile?.resume?.publicId) {
        const oldFilePath = path.join(process.cwd(), "uploads", "resumes", existingProfile.resume.publicId);
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

    return res.status(200).json({
      success: true,
      message: "Student profile updated successfully.",
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating student profile:", error);
    return res.status(500).json({ success: false, message: "Failed to update student profile." });
  }
};
