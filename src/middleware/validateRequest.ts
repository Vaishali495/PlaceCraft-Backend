import type { Request, Response, NextFunction } from "express";
import { z, type ZodType } from "zod";

export const validateRequest = (
  schema: ZodType,
  source: "body" | "query" | "params" = "body",
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const isWrappedRequestSchema =
      schema instanceof z.ZodObject &&
      ("body" in schema.shape || "params" in schema.shape || "query" in schema.shape);

    const payloadToValidate = isWrappedRequestSchema
      ? {
          params: req.params,
          query: req.query,
          body: req.body,
        }
      : req.method === "GET"
        ? req.query
        : req[source];

    const result = schema.safeParse(payloadToValidate);

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

    if (isWrappedRequestSchema && typeof result.data === "object" && result.data !== null) {
      const parsed = result.data as { body?: unknown; query?: unknown };
      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }
      if (parsed.query !== undefined) {
        req.query = parsed.query as Request["query"];
      }
    } else if (source === "body") {
      req.body = result.data;
    }

    next();
  };
};