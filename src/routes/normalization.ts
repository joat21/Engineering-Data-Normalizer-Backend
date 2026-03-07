import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  mapColToAttrSchema,
  applyTransformSchema,
} from "../schemas/normalization";
import * as NormalizationController from "../controllers/NormalizationController";

const router = Router();

router.patch(
  "/map-col-to-attr",
  validate(mapColToAttrSchema),
  NormalizationController.mapColToAttrHandler,
);
router.patch(
  "/apply-transform",
  validate(applyTransformSchema),
  NormalizationController.applyTransformHandler,
);

export default router;
