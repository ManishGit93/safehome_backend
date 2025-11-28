import { Document, Model, Schema, Types, model } from "mongoose";

export interface AuditLogDocument extends Document {
  actorId: Types.ObjectId;
  actorRole: string;
  childId?: Types.ObjectId;
  action: string;
  timestamp: Date;
  meta?: Record<string, unknown>;
}

const AuditLogSchema = new Schema<AuditLogDocument>(
  {
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    actorRole: { type: String, required: true },
    childId: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: false },
);

AuditLogSchema.index({ childId: 1, timestamp: -1 });

export const AuditLogModel: Model<AuditLogDocument> = model<AuditLogDocument>("AuditLog", AuditLogSchema);

