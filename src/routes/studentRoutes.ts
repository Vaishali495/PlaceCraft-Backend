import { Router } from "express";
import { editStudentProfile, getStudentData } from "../controllers/studentController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { editStudentProfileSchema, getStudentDataSchema } from "../validators/studentValidator.js";
import { uploadResume } from "../middleware/uploadMiddleware.js";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";
import { UserRole } from "../utils/enums.js";
const router = Router();

router.get("/get-data", protect, authorizeRoles(UserRole.STUDENT, UserRole.TPO), validateRequest(getStudentDataSchema), getStudentData);
router.post(
  "/edit-profile",
  protect,
  authorizeRoles(UserRole.STUDENT),
  uploadResume.single("resume"),
  validateRequest(editStudentProfileSchema),
  editStudentProfile,
);

export default router;
