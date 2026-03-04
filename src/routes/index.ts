import { Router } from "express";
import importRoutes from "./import";
import categoryRoutes from "./category";
import normalizationRoutes from "./normalization";

const router = Router();

router.use("/import", importRoutes);
router.use("/categories", categoryRoutes);
router.use("/normalization", normalizationRoutes);

export default router;
