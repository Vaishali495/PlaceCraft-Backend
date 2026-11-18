import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import type { UserRole } from "../utils/enums.js";
import type { AuthUserPayload } from "../types/express.js";

// 1. Verify JWT Token & Attach User to req.user
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No authentication token provided.",
      });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Invalid token format.",
      });
    }

    const jwtSecret = process.env.JWT_SECRET || "placecraft_fallback_secret_key";
    const decoded = jwt.verify(token, jwtSecret) as AuthUserPayload;

    // Optional but recommended: Verify user still exists in DB
    const user = await User.findById(decoded.id).select("_id role email isEmailVerified");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
      });
    }

    req.user = {
      id: user._id.toString(),
      role: user.role as UserRole,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please log in again.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid authentication token.",
    });
  }
};

// 2. Role-Based Access Control (RBAC)
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access forbidden. Role '${req.user.role}' is not authorized to access this resource.`,
      });
    }

    next();
  };
};