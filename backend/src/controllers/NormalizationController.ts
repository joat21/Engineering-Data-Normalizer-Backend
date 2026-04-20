import {
  editAiParseResultsSchema,
  aiParseSchema,
  saveAiParseSchema,
  applyTransformSchema,
  mapColToAttrSchema,
  resolveNormalizationIssuesSchema,
  transformConfigSchema,
  parseFileSchema,
} from "@engineering-data-normalizer/shared";
import {
  commitAiParsingResults,
  applyColumnTransformation,
  mapColumnToAttribute,
  resolveNormalizationIssues,
} from "../services/NormalizationService/service";
import { HandlerFromSchema } from "../types/zod";
import {
  editAiParseResults,
  parseFile,
  processAiParsing,
} from "../services/AIService/service";

export const applyTransformHandler: HandlerFromSchema<
  typeof applyTransformSchema
> = async (req, res, next) => {
  try {
    const transform = transformConfigSchema.parse(req.body.transform);

    const result = await applyColumnTransformation({
      sessionId: req.params.sessionId,
      colIndex: req.body.colIndex,
      targets: req.body.targets,
      transform,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const mapColToAttrHandler: HandlerFromSchema<
  typeof mapColToAttrSchema
> = async (req, res, next) => {
  try {
    const result = await mapColumnToAttribute({
      sessionId: req.params.sessionId,
      colIndex: req.body.colIndex,
      target: req.body.target,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const applyAiParseHandler: HandlerFromSchema<
  typeof aiParseSchema
> = async (req, res, next) => {
  try {
    const result = await processAiParsing(req.body);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const saveAiParseHandler: HandlerFromSchema<
  typeof saveAiParseSchema
> = async (req, res, next) => {
  try {
    const result = await commitAiParsingResults({
      parsingSessionId: req.params.sessionId,
      importSessionId: req.body.importSessionId,
      sourceColIndex: req.body.sourceColIndex,
      targets: req.body.targets,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const editAiParseResultsHandler: HandlerFromSchema<
  typeof editAiParseResultsSchema
> = async (req, res, next) => {
  try {
    const result = await editAiParseResults(
      req.params.sessionId,
      req.body.editedValues,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const parseFileHandler: HandlerFromSchema<
  typeof parseFileSchema
> = async (req, res, next) => {
  try {
    const result = await parseFile(req.params.importSessionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const resolveNormalizationIssuesHandler: HandlerFromSchema<
  typeof resolveNormalizationIssuesSchema
> = async (req, res, next) => {
  try {
    const result = await resolveNormalizationIssues({
      importSessionId: req.params.sessionId,
      ...req.body,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
};
