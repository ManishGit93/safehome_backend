import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(createHttpError(404, "Endpoint not found"));
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (createHttpError.isHttpError(err)) {
    return res.status(err.statusCode).json({
      error: err.message,
      details: err.expose ? err : undefined,
    });
  }

  console.error("Unexpected error", err);
  return res.status(500).json({ error: "Unexpected error" });
};


