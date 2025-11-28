import { Document, Model, Schema, model } from "mongoose";

export interface RetentionConfigDocument extends Document {
  locationRetentionDays: number;
}

const RetentionConfigSchema = new Schema<RetentionConfigDocument>({
  locationRetentionDays: { type: Number, default: 30 },
});

export const RetentionConfigModel: Model<RetentionConfigDocument> = model<RetentionConfigDocument>(
  "RetentionConfig",
  RetentionConfigSchema,
);

