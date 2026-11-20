import { Router } from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { verifyStudentSchema } from "../validators/tpoValidator.js";
import { UserRole } from "../utils/enums.js";
import { getStudentsForApproval, verifyStudentProfile } from "../controllers/tpoControllers.js";

const router = Router();

router.use(protect, authorizeRoles(UserRole.TPO));

router.get("/students", getStudentsForApproval);
router.patch(
  "/students/:id/verify",
  validateRequest(verifyStudentSchema),
  verifyStudentProfile,
);

export default router;