import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import path from "path";

const app = express();

// app.use(cors());
app.use(cors({
  origin: ["http://localhost:5173"], // React App URL
  credentials: true,
}));
app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/student",studentRoutes);

app.get("/", (_req, res) => {
  res.json({
    message: "Welcome to PlaceCraft API!",
  });
});

export default app;