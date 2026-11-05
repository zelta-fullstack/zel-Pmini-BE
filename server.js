import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import destinationsRouter from "./src/routes/destinations.js";
import {
  errorHandler,
  notFoundHandler,
} from "./src/middleware/errorHandler.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Request logging middleware - logs method, URL, timestamp, and status
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);

  // Log response status when response finishes
  res.on("finish", () => {
    console.log(`[${timestamp}] ${req.method} ${req.url} - ${res.statusCode}`);
  });

  next();
});

// CORS middleware - secure configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }),
);

// JSON body parser middleware
app.use(express.json());

// Destination routes
app.use("/api/destinations", destinationsRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for unmatched routes
app.use(notFoundHandler);

// Error handler middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
