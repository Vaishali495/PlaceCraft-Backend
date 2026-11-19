import mongoose from "mongoose";
import type { IDrive, IStudentProfile } from "../types/index.js";

const normalizeCourse = (value?: string): string =>
  (value || "")
    .toLowerCase()
    .replace(/[\s.-]/g, "")
    .trim();

export const evaluateDriveForStudent = (
  drive: IDrive & { _id?: mongoose.Types.ObjectId | string },
  profile: IStudentProfile | null,
  appliedDriveIds: Set<string> = new Set<string>(),
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

  const isEligible = Boolean(profile && cgpaMet && backlogsMet && courseMet && fieldMet && batchMet);

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
    hasApplied: drive._id ? appliedDriveIds.has(String(drive._id)) : false,
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