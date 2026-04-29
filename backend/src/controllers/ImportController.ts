import {
  addItemsToStaging,
  createSession,
  deleteStagingItems,
  getStagingTable,
} from "../services/ImportService/service";
import {
  deleteStagingItemsSchema,
  getStagingTableSchema,
  importRowsSchema,
  initImportSchema,
} from "@engineering-data-normalizer/shared";
import { HandlerFromSchema } from "../types/zod";

export const initImportHandler: HandlerFromSchema<
  typeof initImportSchema
> = async (req, res, next) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const result = await createSession({ file, ...req.body });

    res.json(result);
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

export const deleteStagingItemsHandler: HandlerFromSchema<
  typeof deleteStagingItemsSchema
> = async (req, res, next) => {
  try {
    const result = await deleteStagingItems(req.body.ids);
    res.json(result);
  } catch (error) {
    next(error);
  }
};
