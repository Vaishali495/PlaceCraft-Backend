import { Router } from "express";
import { applyToDrive, getMyApplications } from "../controllers/applicationController.js";
import { protect, authorizeRoles } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { applyDriveSchema } from "../validators/applicationValidator.js";
import { UserRole } from "../utils/enums.js";

const router = Router();

router.post(
  "/apply",
  protect,
  authorizeRoles(UserRole.STUDENT),
  validateRequest(applyDriveSchema),
  applyToDrive,
);

router.get(
  "/my-applications",
  protect,
  authorizeRoles(UserRole.STUDENT),
  getMyApplications,
);

export default router;