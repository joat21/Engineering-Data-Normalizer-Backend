import { RequestHandler } from "express";
import {
  applyColumnTransformation,
  mapColumnToAttribute,
} from "../services/NormalizationService";
import { TransformConfig, transformSchema } from "../schemas/normalization";

export const applyTransformHandler: RequestHandler<
  any,
  any,
  {
    sessionId: string;
    colIndex: number;
    transform: TransformConfig;
    attributesOrder: string[];
  }
> = async (req, res, next) => {
  try {
    const transform = transformSchema.parse(req.body.transform);

    await applyColumnTransformation({
      sessionId: req.body.sessionId,
      colIndex: req.body.colIndex,
      transform,
      attributesOrder: req.body.attributesOrder,
    });

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};

export const mapColToAttrHandler: RequestHandler<
  any,
  any,
  {
    sessionId: string;
    colIndex: number;
    attributeId: string;
  }
> = async (req, res, next) => {
  try {
    await mapColumnToAttribute(req.body);

    res.sendStatus(204);
  } catch (error) {
    next(error);
  }
};
