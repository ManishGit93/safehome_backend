import { Router } from "express";
import createHttpError from "http-errors";
import { Types } from "mongoose";
import { z } from "zod";
import { requireRole } from "../middleware/auth";
import { ParentChildLinkModel } from "../models/ParentChildLink";
import { UserModel } from "../models/User";
import { recordAudit } from "../services/auditService";

const router = Router();

const requestSchema = z.object({
  childEmail: z.string().email(),
});

router.post("/request", requireRole("parent"), async (req, res, next) => {
  try {
    const { childEmail } = requestSchema.parse(req.body);
    const parent = req.user!;

    const child = await UserModel.findOne({ email: childEmail, role: "child" });
    if (!child) {
      throw createHttpError(404, "Child account not found");
    }

    const link = await ParentChildLinkModel.findOneAndUpdate(
      { parentId: parent._id, childId: child._id },
      { status: "PENDING" },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    await recordAudit({
      actorId: parent._id,
      actorRole: parent.role,
      childId: child._id,
      action: "LINK_REQUESTED",
    });

    return res.status(201).json(link);
  } catch (error) {
    return next(error);
  }
});

router.get("/pending", requireRole("child"), async (req, res) => {
  const user = req.user!;
  const links = await ParentChildLinkModel.find({ childId: user._id, status: "PENDING" }).populate(
    "parentId",
    "name email",
  );
  return res.json({ links });
});

const linkActionSchema = z.object({
  linkId: z.string().length(24),
});

router.post("/accept", requireRole("child"), async (req, res, next) => {
  try {
    const { linkId } = linkActionSchema.parse(req.body);
    const child = req.user!;

    const link = await ParentChildLinkModel.findOneAndUpdate(
      { _id: linkId, childId: child._id, status: "PENDING" },
      { status: "ACCEPTED" },
      { new: true },
    );

    if (!link) {
      throw createHttpError(404, "Link not found");
    }

    await recordAudit({
      actorId: child._id,
      actorRole: child.role,
      childId: child._id,
      action: "LINK_ACCEPTED",
      meta: { linkId },
    });

    return res.json(link);
  } catch (error) {
    return next(error);
  }
});

router.post("/decline", requireRole("child"), async (req, res, next) => {
  try {
    const { linkId } = linkActionSchema.parse(req.body);
    const child = req.user!;

    const link = await ParentChildLinkModel.findOneAndUpdate(
      { _id: linkId, childId: child._id, status: "PENDING" },
      { status: "DECLINED" },
      { new: true },
    );

    if (!link) {
      throw createHttpError(404, "Link not found");
    }

    await recordAudit({
      actorId: child._id,
      actorRole: child.role,
      childId: child._id,
      action: "LINK_DECLINED",
      meta: { linkId },
    });

    return res.json(link);
  } catch (error) {
    return next(error);
  }
});

router.get("/", requireRole("parent"), async (req, res) => {
  const parent = req.user!;
  const links = await ParentChildLinkModel.find({ parentId: parent._id }).populate("childId", "name email");
  return res.json({ links });
});

router.get("/child", requireRole("child"), async (req, res) => {
  const child = req.user!;
  const links = await ParentChildLinkModel.find({ childId: child._id, status: "ACCEPTED" }).populate(
    "parentId",
    "name email",
  );
  return res.json({ links });
});

export default router;


