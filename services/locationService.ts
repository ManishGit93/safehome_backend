import { Types } from "mongoose";
import { LatestLocationModel } from "../models/LatestLocation";
import { LocationPingModel } from "../models/LocationPing";

export interface LocationPayload {
  userId: Types.ObjectId;
  lat: number;
  lng: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  ts: Date;
}

export const saveLocationPing = async (payload: LocationPayload) => {
  await LocationPingModel.create(payload);

  await LatestLocationModel.findOneAndUpdate(
    { userId: payload.userId },
    {
      $set: {
        lat: payload.lat,
        lng: payload.lng,
        accuracy: payload.accuracy,
        ts: payload.ts,
      },
    },
    { upsert: true, new: true },
  );
};


