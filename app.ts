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

  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
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


