import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import config from "./config/env";
import { csrfMiddleware } from "./middleware/csrf";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { attachUser } from "./middleware/auth";
import routes from "./routes";

export const createApp = () => {
  const app = express();

  // Support multiple origins (comma-separated) or single origin
  const allowedOrigins = config.corsOrigin.split(",").map((origin) => origin.trim());
  
  // Log allowed origins for debugging
  console.log("CORS Configuration - Allowed origins:", allowedOrigins);
  console.log("CORS_ORIGIN env:", process.env.CORS_ORIGIN || "not set");
  
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) {
          return callback(null, true);
        }
        
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        
        // Log for debugging
        console.warn(`CORS: Origin "${origin}" not in allowed list:`, allowedOrigins);
        
        // Return false (not an error) to deny the request
        callback(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
    }),
  );

  if (config.env !== "test") {
    app.use(morgan("dev"));
  }

  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(attachUser);
  app.use(csrfMiddleware);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();


