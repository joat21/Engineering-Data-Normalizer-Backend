import { Router } from "express";
import { validate } from "../middleware/validate";

import * as ProjectController from "../controllers/ProjectController";
import {
  createProjectSchema,
  deleteProjectItemSchema,
  exportProjectToExcelSchema,
  getProjectByIdSchema,
  updateItemAmountSchema,
  updateProjectSchema,
  upsertProjectItemSchema,
} from "../schemas/project";

const router = Router();

router.post(
  "/",
  validate(createProjectSchema),
  ProjectController.createProjectHandler,
);

router.get("/", ProjectController.getProjectsHandler);

router.get(
  "/:id",
  validate(getProjectByIdSchema),
  ProjectController.getProjectByIdHandler,
);

router.patch(
  "/:id",
  validate(updateProjectSchema),
  ProjectController.updateProjectHandler,
);

router.get(
  "/:id/xlsx",
  validate(exportProjectToExcelSchema),
  ProjectController.exportProjectToExcelHandler,
);

router.post(
  "/:projectId/items",
  validate(upsertProjectItemSchema),
  ProjectController.upsertProjectItemHandler,
);

router.patch(
  "/items/:id",
  validate(updateItemAmountSchema),
  ProjectController.updateItemAmountHandler,
);

router.delete(
  "/items/:id",
  validate(deleteProjectItemSchema),
  ProjectController.deleteProjectItemHandler,
);

export default router;
