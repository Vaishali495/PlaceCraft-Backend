import { Router } from "express";
import { authorizeRoles, protect } from "../middleware/authMiddleware.js";
import { UserRole } from "../utils/enums.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { createDriveSchema, deleteDriveSchema, updateDriveSchema } from "../validators/driveValidator.js";
import { createDrive, deleteDrive, getAllDrives, updateDrive } from "../controllers/driveController.js";

const router = Router();

router.get("/", protect, authorizeRoles(UserRole.STUDENT, UserRole.TPO), getAllDrives);

router.post("/create", protect, authorizeRoles(UserRole.TPO), validateRequest(createDriveSchema), createDrive);

router.patch("/:id", protect, authorizeRoles(UserRole.TPO), validateRequest(updateDriveSchema), updateDrive);

router.delete("/:id", protect, authorizeRoles(UserRole.TPO), validateRequest(deleteDriveSchema), deleteDrive);
export default router;
