import { Router } from "express";
import adminRoutes from "./admin";
import auditRoutes from "./audit";
import authRoutes from "./auth";
import childrenRoutes from "./children";
import linkRoutes from "./links";
import locationRoutes from "./location";
import meRoutes from "./me";

const router = Router();

router.use("/auth", authRoutes);
router.use("/me", meRoutes);
router.use("/links", linkRoutes);
router.use("/children", childrenRoutes);
router.use("/audit", auditRoutes);
router.use("/admin", adminRoutes);
router.use("/location", locationRoutes);

export default router;


