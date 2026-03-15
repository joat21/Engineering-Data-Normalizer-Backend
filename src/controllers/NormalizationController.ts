import {
  applyColumnTransformation,
  mapColumnToAttribute,
} from "../services/NormalizationService/service";
import {
  applyTransformSchema,
  mapColToAttrSchema,
  transformSchema,
} from "../schemas/normalization";
import { HandlerFromSchema } from "../types/zod";
import { aiParseSchema } from "../schemas/ai";
import { processAiParsing } from "../services/AIService/service";

export const applyTransformHandler: HandlerFromSchema<
  typeof applyTransformSchema
> = async (req, res, next) => {
  try {
    const transform = transformSchema.parse(req.body.transform);

    await applyColumnTransformation({
      ...req.body,
      transform,
    });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

export const mapColToAttrHandler: HandlerFromSchema<
  typeof mapColToAttrSchema
> = async (req, res, next) => {
  try {
    await mapColumnToAttribute(req.body);

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

export const applyAiParse: HandlerFromSchema<typeof aiParseSchema> = async (
  req,
  res,
  next,
) => {
  try {
    const result = await processAiParsing(req.body);

    res.json(result);
  } catch (error) {
    next(error);
  }
};
