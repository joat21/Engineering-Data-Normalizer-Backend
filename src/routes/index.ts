import { Router } from "express";
import authRoutes from "./auth";
import importRoutes from "./import";
import importSessionsRoutes from "./importSessions";
import aiParseRoutes from "./aiParse";
import equipmentRoutes from "./equipment";
import categoryRoutes from "./category";
import projectRoutes from "./project";
import comparisonRoutes from "./comparison";
import {
  authTokensHandler,
  getUserByToken,
  requireAuth,
} from "../middleware/auth";

const router = Router();

router.use("/auth", authRoutes);

router.use(authTokensHandler);
router.use(getUserByToken);
router.use(requireAuth);

router.use("/import", importRoutes);
router.use("/import-sessions", importSessionsRoutes);
router.use("/ai-parse", aiParseRoutes);
router.use("/equipment", equipmentRoutes);
router.use("/categories", categoryRoutes);
router.use("/projects", projectRoutes);
router.use("/comparison", comparisonRoutes);

export default router;
