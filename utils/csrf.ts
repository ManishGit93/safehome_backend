import crypto from "crypto";
import { Response } from "express";
import config from "../config/env";

export const generateCsrfToken = () => crypto.randomBytes(32).toString("hex");

export const attachCsrfCookie = (res: Response, token?: string) => {
  const value = token ?? generateCsrfToken();

  res.cookie(config.csrfCookieName, value, {
    httpOnly: false,
    sameSite: config.env === "production" ? "none" : "lax",
    secure: config.env === "production",
  });

  return value;
};

