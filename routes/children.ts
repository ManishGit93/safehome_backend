import { Router } from "express";
import createHttpError from "http-errors";
import { Types } from "mongoose";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth";
import { LatestLocationModel } from "../models/LatestLocation";
import { LocationPingModel } from "../models/LocationPing";
import { ParentChildLinkModel } from "../models/ParentChildLink";
import { UserModel } from "../models/User";
import { recordAudit } from "../services/auditService";

const router = Router();

router.get("/", requireRole("parent"), async (req, res) => {
  const parent = req.user!;
  const links = await ParentChildLinkModel.find({ parentId: parent._id, status: "ACCEPTED" }).populate(
    "childId",
    "name email consentGiven",
  );

  const childIds = links
    .map((link) => {
      const child = link.childId as Types.ObjectId | { _id: Types.ObjectId };
      return child instanceof Types.ObjectId ? child : child?._id;
    })
    .filter(Boolean) as Types.ObjectId[];
  const latestLocations = await LatestLocationModel.find({ userId: { $in: childIds } });
  const locationMap = new Map(latestLocations.map((loc) => [loc.userId.toString(), loc]));

  const children = links.map((link) => {
    const child = link.childId as any;
    const loc = locationMap.get(child._id.toString());
    return {
      id: child._id,
      name: child.name,
      email: child.email,
      consentGiven: child.consentGiven,
      lastLocation: loc
        ? {
            lat: loc.lat,
            lng: loc.lng,
            accuracy: loc.accuracy,
            ts: loc.ts,
          }
        : null,
    };
  });

  return res.json({ children });
});

const historySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// Debug endpoint to check child's location tracking status
router.get("/:childId/status", requireAuth, async (req, res, next) => {
  try {
    const { childId } = req.params;
    const requester = req.user!;
    const childObjectId = new Types.ObjectId(childId);

    if (requester.role === "parent") {
      const link = await ParentChildLinkModel.findOne({
        parentId: requester._id,
        childId: childObjectId,
      });
      if (!link) {
        throw createHttpError(403, "Not linked to this child");
      }
    } else if (requester.role === "child" && requester._id.toString() !== childId) {
      throw createHttpError(403, "Cannot view another child");
    }

    const child = await UserModel.findById(childObjectId);
    const link = await ParentChildLinkModel.findOne({
      childId: childObjectId,
    });
    const latestLocation = await LatestLocationModel.findOne({ userId: childObjectId });
    const totalPings = await LocationPingModel.countDocuments({ userId: childObjectId });
    const recentPings = await LocationPingModel.find({ userId: childObjectId })
      .sort({ ts: -1 })
      .limit(5);

    return res.json({
      child: {
        id: child?._id,
        name: child?.name,
        email: child?.email,
        consentGiven: child?.consentGiven,
      },
      link: link ? {
        id: link._id,
        status: link.status,
        parentId: link.parentId,
      } : null,
      location: {
        hasLatestLocation: !!latestLocation,
        latestLocation: latestLocation ? {
          lat: latestLocation.lat,
          lng: latestLocation.lng,
          ts: latestLocation.ts,
        } : null,
        totalPings,
        recentPings: recentPings.map(p => ({
          lat: p.lat,
          lng: p.lng,
          ts: p.ts,
        })),
      },
      recommendations: {
        needsConsent: !child?.consentGiven,
        needsLinkAcceptance: link?.status !== "ACCEPTED",
        needsLocationUpdates: totalPings === 0 && child?.consentGiven && link?.status === "ACCEPTED",
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/:childId/locations", requireAuth, async (req, res, next) => {
  try {
    const { childId } = req.params;
    const filters = historySchema.parse(req.query);
    const requester = req.user!;
    const childObjectId = new Types.ObjectId(childId);

    let link = null;
    if (requester.role === "parent") {
      link = await ParentChildLinkModel.findOne({
        parentId: requester._id,
        childId: childObjectId,
      });
      
      if (!link) {
        throw createHttpError(403, "Not linked to this child");
      }
      
      if (link.status !== "ACCEPTED") {
        return res.json({ 
          pings: [],
          error: `Link exists but status is "${link.status}". Link must be ACCEPTED.`,
          debug: {
            linkId: link._id,
            linkStatus: link.status,
            childId: childId
          }
        });
      }
    } else if (requester.role === "child" && requester._id.toString() !== childId) {
      throw createHttpError(403, "Cannot view another child");
    }

    const from = filters.from ?? new Date(Date.now() - 24 * 60 * 60 * 1000);
    const to = filters.to ?? new Date();

    const pings = await LocationPingModel.find({
      userId: childObjectId,
      ts: { $gte: from, $lte: to },
    })
      .sort({ ts: -1 })
      .limit(500);

    // Check if child has given consent
    const child = await UserModel.findById(childObjectId);
    const hasConsent = child?.consentGiven ?? false;

    await recordAudit({
      actorId: requester._id,
      actorRole: requester.role,
      childId: childObjectId,
      action: "VIEW_CHILD_LOCATION",
      meta: { count: pings.length },
    });

    return res.json({ 
      pings,
      debug: {
        totalPings: pings.length,
        dateRange: { from, to },
        childConsentGiven: hasConsent,
        linkStatus: link?.status
      }
    });
  } catch (error) {
    return next(error);
  }
});

export default router;


