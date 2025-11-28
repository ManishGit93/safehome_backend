import dotenv from "dotenv";

dotenv.config();

export type AppConfig = {
  env: string;
  port: number;
  mongoUri: string;
  jwtSecret: string;
  cookieName: string;
  csrfCookieName: string;
  csrfHeaderName: string;
  corsOrigin: string;
  retentionDaysDefault: number;
};

const config: AppConfig = {
  env: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 5000),
  mongoUri: process.env.MONGODB_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "unsafe-dev-secret",
  cookieName: "safehome_token",
  csrfCookieName: "safehome_csrf",
  csrfHeaderName: "x-csrf-token",
  corsOrigin: process.env.CORS_ORIGIN ?? process.env.FRONTEND_ORIGIN ?? "http://localhost:3000",
  retentionDaysDefault: Number(process.env.LOCATION_RETENTION_DAYS ?? 30),
};

if (!config.mongoUri) {
  console.warn("Warning: MONGODB_URI is not set. The backend will fail to connect to MongoDB.");
}

export default config;

