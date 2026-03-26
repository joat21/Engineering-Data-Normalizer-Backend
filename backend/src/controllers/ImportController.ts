import {
  addItemsToStaging,
  createSession,
  getStagingTable,
} from "../services/ImportService/service";
import {
  getStagingTableSchema,
  importRowsSchema,
  initImportSchema,
} from "@engineering-data-normalizer/shared";
import { HandlerFromSchema } from "../types/zod";

export const initImportHandler: HandlerFromSchema<
  typeof initImportSchema
> = async (req, res, next) => {
  try {
    const { categoryId, sourceType, originHeader, manufacturerId, supplierId } =
      req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const sessionId = await createSession({
      categoryId,
      sourceType,
      file,
      originHeader,
      manufacturerId,
      supplierId,
    });

    res.json({ sessionId });
  } catch (error) {
    next(error);
  }
};

export const importRowsHandler: HandlerFromSchema<
  typeof importRowsSchema
> = async (req, res, next) => {
  try {
    await addItemsToStaging({
      sessionId: req.params.sessionId,
      rows: req.body.rows,
    });

    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
};

export const getStagingTableHandler: HandlerFromSchema<
  typeof getStagingTableSchema
> = async (req, res, next) => {
  try {
    const result = await getStagingTable(req.params.sessionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
