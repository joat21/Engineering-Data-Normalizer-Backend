import { RequestHandler } from "express";
import { getEquipmentCount } from "../services/EquipmentService/service";
import { getActiveProjectsCount } from "../services/ProjectService";
import {
  getCategoriesCount,
  getTopCategories,
} from "../services/CategoryService/service";

export const getSummary: RequestHandler = async (_req, res, next) => {
  try {
    const totalEquipment = await getEquipmentCount();
    const activeProjects = await getActiveProjectsCount();
    const totalCategories = await getCategoriesCount();
    const topCategories = await getTopCategories();

    res.json({
      totalEquipment,
      activeProjects,
      totalCategories,
      topCategories,
    });
  } catch (error) {
    next(error);
  }
};
