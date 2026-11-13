/**
 * Student Placement & Career Management System Enums
 */

// 1. User Roles & Authentication
export enum UserRole {
  STUDENT = "student",
  TPO = "tpo",
}

/**
 * B.Tech Specializations & Engineering Branches Enum
 */
export enum BTechField {
  CSE = "Computer Science and Engineering",
  IT = "Information Technology",
  ECE = "Electronics and Communication Engineering",
  MECH = "Mechanical Engineering",
  CIVIL = "Civil Engineering",
  AI_ML = "Artificial Intelligence and Machine Learning",
  OTHER = "Other / General Engineering",
}

export enum BTechFieldCode {
  CSE = "CSE",
  IT = "IT",
  ECE = "ECE",
  MECH = "MECH",
  CIVIL = "CIVIL",
  AI_ML = "AI/ML",
  OTHER = "OTHER",
}

// Academic Verification Status (TPO Endorsement Seal)
export enum AcademicVerificationStatus {
  PENDING = "Pending",
  VERIFIED = "Verified",
  REJECTED = "Rejected",
}

// Semester Academic Standing Status
export enum SemesterStandingStatus {
  CLEARED = "Cleared",
  BACKLOG = "Backlog",
  ONGOING = "Ongoing",
}

// Placement Drive Package Tiers
export enum DriveTierCategory {
  CORE_TIER = "Core Tier",
  FINTECH_TIER = "FinTech Tier",
  DREAM_TIER = "Dream Tier",
  SUPER_DREAM_TIER = "Super Dream Tier",
}

// Recruitment Drive Status
export enum DriveStatus {
  OPEN = "Open",
  CLOSED = "Closed",
  ARCHIVED = "Archived",
}

// Recruitment Pipeline Application Status
export enum ApplicationStatus {
  APPLIED = "Applied",
  OA_PENDING = "OA Pending",
  SHORTLISTED = "Shortlisted",
  INTERVIEW_SCHEDULED = "Interview Scheduled",
  OFFERED = "Offered",
  REJECTED = "Rejected",
}

// Student Overall Placement Status ("One Student, One Offer" Policy)
export enum StudentPlacementStatus {
  UNPLACED = "Unplaced",
  PLACED = "Placed",
  BLOCKED = "Blocked",
}