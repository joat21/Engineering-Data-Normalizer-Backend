import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  mapColToAttrSchema,
  applyTransformSchema,
} from "../schemas/normalization";
import * as NormalizationController from "../controllers/NormalizationController";
import { aiParseSchema } from "../schemas/ai";

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
router.post(
  "/ai",
  validate(aiParseSchema),
  NormalizationController.applyAiParse,
);

export default router;
