import type { Request, Response } from "express";
import { StudentRepository } from "../repositories/studentRepository.js";
import { AcademicVerificationStatus } from "../utils/enums.js";

export const getStudentsForApproval = async (_req: Request, res: Response) => {
  try {
    const students = await StudentRepository.findAllStudentsForTpo();
    return res.status(200).json({
      success: true,
      message: "Student profiles fetched successfully.",
      data: students,
    });
  } catch (error) {
    console.error("Error fetching students for TPO:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching students.",
    });
  }
};


export const verifyStudentProfile = async (req: Request, res: Response) => {
  try {
    const tpoId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body as {
      status: AcademicVerificationStatus;
    };

    if (!tpoId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. TPO user ID missing.",
      });
    }

    const profileId = Array.isArray(id) ? id[0] : id;
    if (!profileId) {
      return res.status(400).json({
        success: false,
        message: "Student profile ID is required.",
      });
    }

    const existingProfile = await StudentRepository.findProfileById(profileId);
    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }
    console.log("existingProfile: ",existingProfile);

    const isRequestingVerified =
      status.toLowerCase() === AcademicVerificationStatus.VERIFIED.toLowerCase();
      console.log("isRequestingVerified: ",isRequestingVerified);
      const isAlreadyVerified =
      (existingProfile.academicVerification?.status || "").toLowerCase() ===
      AcademicVerificationStatus.VERIFIED.toLowerCase();
      console.log("isAlreadyVerified: ",isAlreadyVerified);

    if (isRequestingVerified && isAlreadyVerified) {
      return res.status(400).json({
        success: false,
        message: "Already approved.",
      });
    }

    const updatedProfile = await StudentRepository.updateAcademicVerificationById(
      profileId,
      status,
      tpoId,
    );
    console.log("updatedProfile: ",updatedProfile);

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Student profile ${status.toLowerCase()} successfully.`,
      data: updatedProfile,
    });
  } catch (error) {
    console.error("Error updating student verification:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating verification status.",
    });
  }
};