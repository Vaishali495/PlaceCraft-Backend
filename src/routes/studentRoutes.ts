import { Router } from "express";
import { editStudentProfile, getStudentData } from "../controllers/studentController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { editStudentProfileSchema, getStudentDataSchema } from "../validators/studentValidator.js";
import { uploadResume } from "../middleware/uploadMiddleware.js";
const router = Router();

router.get("/get-data", validateRequest(getStudentDataSchema), getStudentData);
router.post("/edit-profile", uploadResume.single("resume"), validateRequest(editStudentProfileSchema), editStudentProfile);

export default router;
