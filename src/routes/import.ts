import { Router } from "express";
import { upload } from "../middleware/upload";
import { validate } from "../middleware/validate";
import { importRowsSchema, initImportSchema } from "../schemas/import";
import * as ImportController from "../controllers/ImportController";

const router = Router();

router.post(
  "/init",
  upload.single("file"),
  validate(initImportSchema),
  ImportController.initImportHandler,
);
router.post(
  "/staging",
  validate(importRowsSchema),
  ImportController.importRowsHandler,
);

export default router;
