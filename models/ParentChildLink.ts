import { Document, Model, Schema, Types, model } from "mongoose";

export type LinkStatus = "PENDING" | "ACCEPTED" | "DECLINED" | "REVOKED";

export interface ParentChildLinkDocument extends Document {
  parentId: Types.ObjectId;
  childId: Types.ObjectId;
  status: LinkStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ParentChildLinkSchema = new Schema<ParentChildLinkDocument>(
  {
    parentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    childId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "DECLINED", "REVOKED"],
      default: "PENDING",
    },
  },
  { timestamps: true },
);

ParentChildLinkSchema.index({ parentId: 1, childId: 1 }, { unique: true });

export const ParentChildLinkModel: Model<ParentChildLinkDocument> = model<ParentChildLinkDocument>(
  "ParentChildLink",
  ParentChildLinkSchema,
);

