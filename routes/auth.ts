import { Router } from "express";
import createHttpError from "http-errors";
import { z } from "zod";
import config from "../config/env";
import { attachCsrfCookie } from "../utils/csrf";
import { hashPassword, verifyPassword } from "../utils/password";
import { signJwt } from "../utils/jwt";
import { validate } from "../utils/validation";
import { UserModel } from "../models/User";

const router = Router();

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["child", "parent"]),
});

router.post("/signup", async (req, res, next) => {
  try {
    const data = validate(signupSchema, req.body);
    const existing = await UserModel.findOne({ email: data.email });
    if (existing) {
      throw createHttpError(409, "Email already registered");
    }

    const passwordHash = await hashPassword(data.password);
    const user = await UserModel.create({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
    });

    const token = signJwt(user);
    res.cookie(config.cookieName, token, {
      httpOnly: true,
      sameSite: config.env === "production" ? "none" : "lax",
      secure: config.env === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const csrfToken = attachCsrfCookie(res);
    return res.status(201).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        consentGiven: user.consentGiven,
      },
      csrfToken,
    });
  } catch (error) {
    return next(error);
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post("/login", async (req, res, next) => {
  try {
    const data = validate(loginSchema, req.body);
    const user = await UserModel.findOne({ email: data.email });
    if (!user) {
      throw createHttpError(401, "Invalid credentials");
    }

    const isValid = await verifyPassword(data.password, user.passwordHash);
    if (!isValid) {
      throw createHttpError(401, "Invalid credentials");
    }

    const token = signJwt(user);
    res.cookie(config.cookieName, token, {
      httpOnly: true,
      sameSite: config.env === "production" ? "none" : "lax",
      secure: config.env === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const csrfToken = attachCsrfCookie(res);

    return res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        consentGiven: user.consentGiven,
      },
      csrfToken,
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/logout", (_req, res) => {
  res.clearCookie(config.cookieName);
  res.clearCookie(config.csrfCookieName);
  return res.json({ success: true });
});

router.get("/csrf", (_req, res) => {
  const csrfToken = attachCsrfCookie(res);
  return res.json({ csrfToken, headerName: config.csrfHeaderName });
});

export default router;


