import { Router } from "express";
import { Types } from "mongoose";
import { requireRole } from "../middleware/auth";
import { AuditLogModel } from "../models/AuditLog";
import { ParentChildLinkModel } from "../models/ParentChildLink";

const router = Router();

router.get("/", requireRole("parent"), async (req, res) => {
  const parent = req.user!;
  const links = await ParentChildLinkModel.find({ parentId: parent._id, status: "ACCEPTED" });
  const childIds = links.map((link) => link.childId);

  const logs = await AuditLogModel.find({ childId: { $in: childIds as Types.ObjectId[] } })
    .sort({ timestamp: -1 })
    .limit(10);

  return res.json({ logs });
});

export default router;


