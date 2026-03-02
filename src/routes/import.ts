import { Router } from "express";
import { upload } from "../middleware/upload";
import * as ImportController from "../controllers/ImportController";

const router = Router();

router.post("/init", upload.single("file"), ImportController.initImport);

export default router;
