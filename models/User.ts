import { Document, Model, Schema, model } from "mongoose";

export type UserRole = "child" | "parent" | "admin";

export interface UserDocument extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  consentGiven: boolean;
  consentTextVersion?: string | null;
  consentAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["child", "parent", "admin"], required: true },
    consentGiven: { type: Boolean, default: false },
    consentTextVersion: { type: String, default: null },
    consentAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const UserModel: Model<UserDocument> = model<UserDocument>("User", UserSchema);

