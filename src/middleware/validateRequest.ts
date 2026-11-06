import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";

export const validateRequest = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const data = req.method === "GET" ? req.query : req.body;
    const result = schema.safeParse(data);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    req.body = result.data;
    next();
  };
};
