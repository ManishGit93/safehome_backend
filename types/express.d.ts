import { UserDocument } from "../models/User";

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface Request {
      user?: UserDocument;
      csrfToken?: string;
    }
  }
}

export {};

