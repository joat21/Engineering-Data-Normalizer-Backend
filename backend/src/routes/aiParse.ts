import { Router } from "express";
import {
  aiParseSchema,
  editAiParseResultsSchema,
  parseFileSchema,
  saveAiParseSchema,
} from "@engineering-data-normalizer/shared";
import { validate } from "../middleware/validate";
import * as NormalizationController from "../controllers/NormalizationController";

const router = Router();

router.post(
  "/",
  validate(aiParseSchema),
  NormalizationController.applyAiParseHandler,
);

router.patch(
  "/:sessionId",
  validate(editAiParseResultsSchema),
  NormalizationController.editAiParseResultsHandler,
);

router.post(
  "/:sessionId/commit",
  validate(saveAiParseSchema),
  NormalizationController.saveAiParseHandler,
);

router.get(
  "/:importSessionId",
  validate(parseFileSchema),
  NormalizationController.parseFileHandler,
);

export default router;
