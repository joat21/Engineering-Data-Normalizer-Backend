import { Router } from "express";
import {
  createCategoryAttributeSchema,
  createCategorySchema,
  getAttributesForImportSchema,
  getCategoryFiltersSchema,
  getCategoryWithAttributesSchema,
  updateCategoryAttributeSchema,
} from "@engineering-data-normalizer/shared";
import { validate } from "../middleware/validate";
import * as CategoryController from "../controllers/CategoryController";

const router = Router();

router.get("/", CategoryController.getCategoriesHandler);

router.get(
  "/:id/filters",
  validate(getCategoryFiltersSchema),
  CategoryController.getCategoryFiltersHandler,
);

router.get(
  "/:importSessionId/attributes",
  validate(getAttributesForImportSchema),
  CategoryController.getAttributesForImportHandler,
);

router.get(
  "/:id",
  validate(getCategoryWithAttributesSchema),
  CategoryController.getCategoryWithAttributesHandler,
);

router.post(
  "/",
  validate(createCategorySchema),
  CategoryController.createCategoryHandler,
);

router.post(
  "/:id/attributes",
  validate(createCategoryAttributeSchema),
  CategoryController.createCategoryAttributeHandler,
);

router.patch(
  "/attributes/:id",
  validate(updateCategoryAttributeSchema),
  CategoryController.updateCategoryAttributeHandler,
);

export default router;
