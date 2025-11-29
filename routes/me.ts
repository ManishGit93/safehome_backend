import { Router } from "express";
import createHttpError from "http-errors";
import { Types } from "mongoose";
import { z } from "zod";
import config from "../config/env";
import { requireAuth, requireRole } from "../middleware/auth";
import { attachCsrfCookie } from "../utils/csrf";
import { ParentChildLinkModel } from "../models/ParentChildLink";
import { LocationPingModel } from "../models/LocationPing";
import { LatestLocationModel } from "../models/LatestLocation";
import { AuditLogModel } from "../models/AuditLog";
import { recordAudit } from "../services/auditService";
import { saveLocationPing } from "../services/locationService";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const user = req.user!;
  const csrf = attachCsrfCookie(res);

  return res.json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      consentGiven: user.consentGiven,
      consentTextVersion: user.consentTextVersion,
      consentAt: user.consentAt,
    },
    csrfToken: csrf,
  });
});

const consentSchema = z.object({
  consentGiven: z.boolean(),
  consentTextVersion: z.string().default("v1"),
});

router.post("/consent", requireRole("child"), async (req, res, next) => {
  try {
    const data = consentSchema.parse(req.body);
    const user = req.user!;

    user.consentGiven = data.consentGiven;
    user.consentTextVersion = data.consentGiven ? data.consentTextVersion : null;
    user.consentAt = data.consentGiven ? new Date() : null;
    await user.save();

    await recordAudit({
      actorId: user._id,
      actorRole: user.role,
      childId: user._id,
      action: data.consentGiven ? "CONSENT_GRANTED" : "CONSENT_REVOKED",
    });

    return res.json({
      consentGiven: user.consentGiven,
      consentAt: user.consentAt,
    });
  } catch (error) {
    return next(error);
  }
});

const revokeSchema = z.object({
  parentId: z
    .string()
    .length(24)
    .regex(/^[a-fA-F0-9]{24}$/),
});

router.post("/revoke-parent", requireRole("child"), async (req, res, next) => {
  try {
    const data = revokeSchema.parse(req.body);
    const user = req.user!;
    const parentObjectId = new Types.ObjectId(data.parentId);

    await ParentChildLinkModel.findOneAndUpdate(
      { parentId: parentObjectId, childId: user._id, status: "ACCEPTED" },
      { status: "REVOKED" },
    );

    await recordAudit({
      actorId: user._id,
      actorRole: user.role,
      childId: user._id,
      action: "REVOKE_PARENT",
      meta: { parentId: data.parentId },
    });

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

router.post("/export", requireRole("child"), async (req, res, next) => {
  try {
    const user = req.user!;
    const [links, pings] = await Promise.all([
      ParentChildLinkModel.find({ childId: user._id }),
      LocationPingModel.find({ userId: user._id }).sort({ ts: -1 }),
    ]);

    const payload = {
      exportedAt: new Date(),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
      links,
      pings,
    };

    await recordAudit({
      actorId: user._id,
      actorRole: user.role,
      childId: user._id,
      action: "EXPORT_DATA",
      meta: { totalPings: pings.length },
    });

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="safehome-${user._id}.json"`);
    return res.send(JSON.stringify(payload, null, 2));
  } catch (error) {
    return next(error);
  }
});

const locationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
});

router.post("/location", requireRole("child"), async (req, res, next) => {
  try {
    const user = req.user!;
    
    if (!user.consentGiven) {
      throw createHttpError(403, "Consent required before sending location");
    }

    const data = locationUpdateSchema.parse(req.body);
    const now = new Date();

    await saveLocationPing({
      userId: user._id,
      lat: data.lat,
      lng: data.lng,
      accuracy: data.accuracy,
      speed: data.speed,
      heading: data.heading,
      ts: now,
    });

    await recordAudit({
      actorId: user._id,
      actorRole: user.role,
      childId: user._id,
      action: "LOCATION_UPDATE",
      meta: { lat: data.lat, lng: data.lng },
    });

    return res.json({ 
      ok: true, 
      message: "Location updated successfully",
      timestamp: now 
    });
  } catch (error) {
    return next(error);
  }
});

router.post("/delete-account", requireRole("child"), async (req, res, next) => {
  try {
    const user = req.user!;

    await Promise.all([
      ParentChildLinkModel.deleteMany({ $or: [{ childId: user._id }, { parentId: user._id }] }),
      LocationPingModel.deleteMany({ userId: user._id }),
      LatestLocationModel.deleteMany({ userId: user._id }),
      AuditLogModel.deleteMany({ $or: [{ actorId: user._id }, { childId: user._id }] }),
    ]);

    await user.deleteOne();

    await recordAudit({
      actorId: user._id,
      actorRole: user.role,
      childId: user._id,
      action: "DELETE_ACCOUNT",
    });

    res.clearCookie(config.cookieName);
    res.clearCookie(config.csrfCookieName);

    return res.json({ deleted: true });
  } catch (error) {
    return next(error);
  }
});

export default router;


