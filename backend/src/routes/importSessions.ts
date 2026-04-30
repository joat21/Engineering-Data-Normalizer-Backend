import { Router } from "express";
import {
  applyTransformSchema,
  mapColToAttrSchema,
  resetColumnSchema,
  resolveNormalizationIssuesSchema,
} from "@engineering-data-normalizer/shared";
import { validate } from "../middleware/validate";
import * as NormalizationController from "../controllers/NormalizationController";

const router = Router();

router.post(
  "/:sessionId/mapping",
  validate(mapColToAttrSchema),
  // Express типизирует req.params как ParamsDictionary, поэтому каст
  NormalizationController.mapColToAttrHandler as any,
);

router.post(
  "/:sessionId/transform",
  validate(applyTransformSchema),
  // Express типизирует req.params как ParamsDictionary, поэтому каст
  NormalizationController.applyTransformHandler as any,
);

router.patch(
  "/:sessionId",
  validate(resolveNormalizationIssuesSchema),
  NormalizationController.resolveNormalizationIssuesHandler,
);

router.patch(
  "/:sessionId/reset",
  validate(resetColumnSchema),
  NormalizationController.resetColumnHandler,
);

export default router;
