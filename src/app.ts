import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import path from "path";
import indexRoutes from "./routes/indexRoutes.js";

const app = express();

// CORS and Body Parsers
app.use(
  cors({
    origin: process.env.FRONTEND_URL || ["http://localhost:5173"], // React App URL
    credentials: true,
  }),
);
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health Check & API Routes
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to PlaceCraft API",
  });
});

app.use("/api", indexRoutes);

// 404 Handler for Unknown Routes
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Centralized Global Error Handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled Error:", err.message);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
