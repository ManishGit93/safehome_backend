import { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import config from "../config/env";
import { UserModel, UserRole } from "../models/User";
import { verifyJwt } from "../utils/jwt";

const extractToken = (req: Request): string | undefined => {
  const cookieToken = req.cookies?.[config.cookieName];
  if (cookieToken) {
    return cookieToken;
  }

  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }

  return undefined;
};

export const attachUser = async (req: Request, _res: Response, next: NextFunction) => {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const payload = verifyJwt(token);
    const user = await UserModel.findById(payload.sub);
    if (user) {
      req.user = user;
    }
  } catch (error) {
    console.warn("Failed to verify JWT", error);
  }

  return next();
};

export const requireAuth = (req: Request, _res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(createHttpError(401, "Authentication required"));
  }
  return next();
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return requireAuth(req, res, next);
    }

    if (!roles.includes(req.user.role)) {
      return next(createHttpError(403, "Insufficient permissions"));
    }

    return next();
  };
};


