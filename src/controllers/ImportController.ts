import { addItemsToStaging, createSession } from "../services/ImportService";
import { importRowsSchema, initImportSchema } from "../schemas/import";
import { HandlerFromSchema } from "../types/zod";

export const initImportHandler: HandlerFromSchema<
  typeof initImportSchema
> = async (req, res, next) => {
  try {
    const { categoryId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const sessionId = await createSession({
      categoryId,
      file,
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
    await addItemsToStaging(req.body);

    res.sendStatus(201);
  } catch (error) {
    next(error);
  }
};
