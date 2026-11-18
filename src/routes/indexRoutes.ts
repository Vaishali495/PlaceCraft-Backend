import { Router } from "express";
import authRoutes from "./authRoutes.js";
import studentRoutes from "./studentRoutes.js";
import driveRoutes from "./driveRoutes.js"

const router = Router();

router.use("/auth",authRoutes);
router.use("/student",studentRoutes);
router.use("drive",driveRoutes);

export default router;