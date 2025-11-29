import { Router } from "express";
import createHttpError from "http-errors";
import { z } from "zod";
import { requireRole } from "../middleware/auth";
import { saveLocationPing } from "../services/locationService";
import { recordAudit } from "../services/auditService";

const router = Router();

const locationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().optional(),
});

router.post("/", requireRole("child"), async (req, res, next) => {
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

export default router;

