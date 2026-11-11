import { Router } from "express";
import { editStudentProfile, getStudentData } from "../controllers/studentController.js";
const router = Router();

router.get("/get-data",getStudentData);
router.post("/edit-profile",editStudentProfile);

export default router;
