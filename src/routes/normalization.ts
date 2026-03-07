import { Router } from "express";
import * as NormalizationController from "../controllers/NormalizationController";

const router = Router();

router.patch("/map-col-to-attr", NormalizationController.mapColToAttrHandler);
router.patch("/apply-transform", NormalizationController.applyTransformHandler);

export default router;
