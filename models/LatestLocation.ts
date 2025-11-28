import { Document, Model, Schema, Types, model } from "mongoose";

export interface LatestLocationDocument extends Document {
  userId: Types.ObjectId;
  lat: number;
  lng: number;
  accuracy?: number;
  ts: Date;
}

const LatestLocationSchema = new Schema<LatestLocationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", unique: true, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: Number,
    ts: { type: Date, required: true },
  },
  { timestamps: false },
);

export const LatestLocationModel: Model<LatestLocationDocument> = model<LatestLocationDocument>(
  "LatestLocation",
  LatestLocationSchema,
);

