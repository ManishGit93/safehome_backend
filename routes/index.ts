import { Router } from "express";
import adminRoutes from "./admin";
import auditRoutes from "./audit";
import authRoutes from "./auth";
import childrenRoutes from "./children";
import linkRoutes from "./links";
import meRoutes from "./me";

const router = Router();

router.use("/auth", authRoutes);
router.use("/me", meRoutes);
router.use("/links", linkRoutes);
router.use("/children", childrenRoutes);
router.use("/audit", auditRoutes);
router.use("/admin", adminRoutes);

export default router;


