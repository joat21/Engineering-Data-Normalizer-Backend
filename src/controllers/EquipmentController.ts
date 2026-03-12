import {
  getEquipmentTableSchema,
  saveFromStagingSchema,
} from "../schemas/equipment";
import { recalculateFilters } from "../services/EquipmentService/helpers";
import {
  getEquipmentTable,
  saveEquipmentFromStaging,
} from "../services/EquipmentService/service";
import { HandlerFromSchema } from "../types/zod";

export const saveFromStagingHandler: HandlerFromSchema<
  typeof saveFromStagingSchema
> = async (req, res, next) => {
  try {
    const result = await saveEquipmentFromStaging(req.body.sessionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getEquipmentTableHandler: HandlerFromSchema<
  typeof getEquipmentTableSchema
> = async (req, res, next) => {
  try {
    const equipmentTable = await getEquipmentTable(
      req.query.categoryId,
      req.body.query,
    );
    res.json(equipmentTable);
  } catch (error) {
    next(error);
  }
};

export const _recalculateFiltersHandler: HandlerFromSchema<
  typeof getEquipmentTableSchema
> = async (req, res, next) => {
  try {
    await recalculateFilters(req.query.categoryId);
    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
