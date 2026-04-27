import { RequestHandler } from "express";
import {
  createCategoryAttributeSchema,
  createCategorySchema,
  getAttributesForImportSchema,
  getCategoryFiltersSchema,
  getCategoryWithAttributesSchema,
  updateCategoryAttributeSchema,
} from "@engineering-data-normalizer/shared";
import { HandlerFromSchema } from "../types/zod";
import {
  createCategory,
  createCategoryAttribute,
  getAttributesForImport,
  getCategories,
  getCategoryFilters,
  getCategoryWithAttributes,
  updateCategoryAttribute,
} from "../services/CategoryService/service";

export const getCategoriesHandler: RequestHandler = async (_req, res, next) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};

export const getCategoryFiltersHandler: HandlerFromSchema<
  typeof getCategoryFiltersSchema
> = async (req, res, next) => {
  try {
    const filters = await getCategoryFilters(req.params.id);

    res.json(filters);
  } catch (error) {
    next(error);
  }
};

export const getAttributesForImportHandler: HandlerFromSchema<
  typeof getAttributesForImportSchema
> = async (req, res, next) => {
  try {
    const attributes = await getAttributesForImport(req.params.importSessionId);

    res.json(attributes);
  } catch (error) {
    next(error);
  }
};

export const getCategoryWithAttributesHandler: HandlerFromSchema<
  typeof getCategoryWithAttributesSchema
> = async (req, res, next) => {
  try {
    const category = await getCategoryWithAttributes(req.params.id);

    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const createCategoryHandler: HandlerFromSchema<
  typeof createCategorySchema
> = async (req, res, next) => {
  try {
    const category = await createCategory(req.body);

    res.json(category);
  } catch (error) {
    next(error);
  }
};

export const createCategoryAttributeHandler: HandlerFromSchema<
  typeof createCategoryAttributeSchema
> = async (req, res, next) => {
  try {
    const attribute = await createCategoryAttribute({
      ...req.params,
      ...req.body,
    });

    res.json(attribute);
  } catch (error) {
    next(error);
  }
};

export const updateCategoryAttributeHandler: HandlerFromSchema<
  typeof updateCategoryAttributeSchema
> = async (req, res, next) => {
  try {
    const attribute = await updateCategoryAttribute({
      ...req.params,
      ...req.body,
    });

    res.json(attribute);
  } catch (error) {
    next(error);
  }
};
