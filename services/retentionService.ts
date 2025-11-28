import config from "../config/env";
import { LocationPingModel } from "../models/LocationPing";
import { RetentionConfigModel } from "../models/RetentionConfig";

export const getRetentionDays = async () => {
  const doc = await RetentionConfigModel.findOne();
  return doc?.locationRetentionDays ?? config.retentionDaysDefault;
};

export const runRetentionCleanup = async () => {
  const days = await getRetentionDays();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await LocationPingModel.deleteMany({ ts: { $lt: cutoff } });

  return {
    deletedCount: result.deletedCount ?? 0,
    retentionDays: days,
    cutoff,
  };
};


