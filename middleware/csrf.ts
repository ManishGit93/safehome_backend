import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import config from "../config/env";
import { attachCsrfCookie } from "../utils/csrf";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const csrfMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const existingCookie = req.cookies?.[config.csrfCookieName];
  const token = existingCookie ?? attachCsrfCookie(res);
  req.csrfToken = token;

  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  const headerToken = req.get(config.csrfHeaderName);
  if (!headerToken || headerToken !== token) {
    return next(createHttpError(403, "Invalid CSRF token"));
  }

  return next();
};


