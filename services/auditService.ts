import { Types } from "mongoose";
import { AuditLogModel } from "../models/AuditLog";
import { UserRole } from "../models/User";

export interface AuditEvent {
  actorId: Types.ObjectId;
  actorRole: UserRole | string;
  childId?: Types.ObjectId;
  action: string;
  meta?: Record<string, unknown>;
}

export const recordAudit = async (event: AuditEvent) => {
  await AuditLogModel.create({
    ...event,
    timestamp: new Date(),
  });
};


