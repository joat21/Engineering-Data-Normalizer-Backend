import { RequestHandler } from "express";
import { getCategories } from "../services/EquipmentService/service";

export const getAll: RequestHandler = async (_req, res, next) => {
  try {
    const categories = await getCategories();
    res.json(categories);
  } catch (error) {
    next(error);
  }
};
