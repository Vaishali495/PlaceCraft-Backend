import { Router } from "express";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";
import { UserRole } from "../utils/enums.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { createDriveSchema } from "../validators/driveValidator.js";
import { createDrive, getAllDrives } from "../controllers/driveController.js";

const router = Router();

router.get("/", protect, authorizeRoles(UserRole.STUDENT, UserRole.TPO), getAllDrives);

router.post("/create", protect, authorizeRoles(UserRole.TPO), validateRequest(createDriveSchema), createDrive);

export default router;
