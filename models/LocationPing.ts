import { Document, Model, Schema, Types, model } from "mongoose";

export interface LocationPingDocument extends Document {
  userId: Types.ObjectId;
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  ts: Date;
}

const LocationPingSchema = new Schema<LocationPingDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    accuracy: Number,
    speed: Number,
    heading: Number,
    ts: { type: Date, required: true },
  },
  {
    timestamps: false,
  },
);

LocationPingSchema.index({ userId: 1, ts: -1 });

export const LocationPingModel: Model<LocationPingDocument> = model<LocationPingDocument>(
  "LocationPing",
  LocationPingSchema,
);

