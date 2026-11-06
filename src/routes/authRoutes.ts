import { Router } from "express";

import { loginUser, registerStudent, registerTpo, resendVerificationEmail, verifyEmail } from "../controllers/authController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { emailVerifySchema, loginSchema, registerSchema, resendVerificationSchema } from "../validators/authValidator.js";

const router = Router();

router.post("/register-student", validateRequest(registerSchema), registerStudent);
router.post("/register-tpo", validateRequest(registerSchema), registerTpo);
router.get("/verify-email",validateRequest(emailVerifySchema), verifyEmail);
router.post("/resend-verification",validateRequest(resendVerificationSchema) ,resendVerificationEmail);
router.post("/login",validateRequest(loginSchema),loginUser);
export default router;
