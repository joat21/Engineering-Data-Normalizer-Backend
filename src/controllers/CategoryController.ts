import { RequestHandler } from "express";
import { HandlerFromSchema } from "../types/zod";
import { getCategoryFiltersSchema } from "../schemas/category";
import {
  getCategories,
  getCategoryFilters,
} from "../services/CategoryService/service";

export const getAllHandler: RequestHandler = async (_req, res, next) => {
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
    const { id } = req.params;
    const filters = await getCategoryFilters(id);

    res.json(filters);
  } catch (error) {
    next(error);
  }
};
