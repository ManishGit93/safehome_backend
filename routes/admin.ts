import { Router } from "express";
import { z } from "zod";
import { requireRole } from "../middleware/auth";
import { AuditLogModel } from "../models/AuditLog";
import { runRetentionCleanup } from "../services/retentionService";

const router = Router();

router.post("/run-retention-cleanup", requireRole("admin"), async (_req, res, next) => {
  try {
    const result = await runRetentionCleanup();
    return res.json(result);
  } catch (error) {
    return next(error);
  }
});

const auditQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

router.get("/audit", requireRole("admin"), async (req, res, next) => {
  try {
    const { page, limit } = auditQuerySchema.parse(req.query);
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      AuditLogModel.find().sort({ timestamp: -1 }).skip(skip).limit(limit),
      AuditLogModel.countDocuments(),
    ]);

    return res.json({ logs, page, total });
  } catch (error) {
    return next(error);
  }
});

export default router;


