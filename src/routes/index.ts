import { Router } from "express";
import importRoutes from "./import";
import categoryRoutes from "./category";

const router = Router();

router.use("/import", importRoutes);
router.use("/categories", categoryRoutes);

export default router;
