import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  applyTransformSchema,
  mapColToAttrSchema,
  resolveNormalizationIssuesSchema,
} from "../schemas/normalization";
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

export default router;
