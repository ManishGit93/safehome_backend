import jwt from "jsonwebtoken";
import config from "../config/env";
import { UserDocument } from "../models/User";

export interface JwtPayload {
  sub: string;
  role: string;
}

export const signJwt = (user: UserDocument) => {
  const payload: JwtPayload = {
    sub: user._id.toString(),
    role: user.role,
  };

  return jwt.sign(payload, config.jwtSecret, { expiresIn: "7d" });
};

export const verifyJwt = (token: string) => {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
};

