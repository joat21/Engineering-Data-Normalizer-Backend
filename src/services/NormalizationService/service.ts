import {
  buildSingleNormalizationContext,
  buildTransformedRows,
  saveTransformedRows,
} from "./builders";
import { applyTransform } from "./transformers";
import {
  MappingTarget,
  NormalizedResult,
  NormalizedValue,
  NormalizeSingleEntity,
  TransformConfig,
} from "./types";
import { prisma } from "../../../prisma/prisma";
import { getRawValue } from "../../helpers/getRawValue";
import { TARGET_TYPE } from "../../config";
import { createSingleEquipment } from "../EquipmentService/service";
import { enrichIssuesWithOptions } from "./helpers";

export const mapColumnToAttribute = async (params: {
  sessionId: string;
  colIndex: number;
  target: MappingTarget;
}) =>
  updateColumn({
    sessionId: params.sessionId,
    colIndex: params.colIndex,
    targets: [params.target],
    getUpdatedData: (rawValue) => [rawValue],
  });

export const applyColumnTransformation = async (params: {
  sessionId: string;
  colIndex: number;
  transform: TransformConfig;
  targets: (MappingTarget | null)[];
}) =>
  updateColumn({
    sessionId: params.sessionId,
    colIndex: params.colIndex,
    targets: params.targets,
    getUpdatedData: (rawValue) => applyTransform(rawValue, params.transform),
  });

const updateColumn = async (params: {
  sessionId: string;
  colIndex: number;
  targets: (MappingTarget | null)[];
  getUpdatedData: (rawValue: any) => any[];
}) => {
  const { sessionId, colIndex, targets, getUpdatedData } = params;

  const items = await prisma.stagingImportItem.findMany({
    where: { sessionId },
    select: { id: true, rawRow: true, transformedRow: true },
  });

  const updatedValuesByItem = new Map<string, string[]>();
  const rawValueByItem = new Map<string, string>();

  items.forEach((item) => {
    const rawValue = getRawValue(item.rawRow, colIndex);
    const updated = getUpdatedData(rawValue);

    updatedValuesByItem.set(
      item.id,
      updated.map((v) => String(v ?? "")),
    );

    rawValueByItem.set(item.id, String(rawValue ?? ""));
  });

  return processNormalizationPipeline({
    items,
    colIndex,
    targets,
    updatedValuesByItem,
    rawValueByItem,
  });
};

export const applyAiParse = async (params: {
  importSessionId: string;
  parsingSessionId: string;
  sourceColIndex: number;
  targets: MappingTarget[];
}) => {
  const { importSessionId, parsingSessionId, sourceColIndex, targets } = params;

  const aiRows = await prisma.aiParseResult.findMany({
    where: { sessionId: parsingSessionId },
  });

  if (!aiRows.length) {
    throw new Error("Parsing session not found");
  }

  const items = await prisma.stagingImportItem.findMany({
    where: { sessionId: importSessionId },
    select: { id: true, rawRow: true, transformedRow: true },
  });

  const rawValueByItem = new Map<string, string>();

  items.forEach((item) => {
    const rawValue = getRawValue(item.rawRow, sourceColIndex);
    rawValueByItem.set(item.id, String(rawValue ?? ""));
  });

  const grouped = new Map<string, Map<string, string>>();

  aiRows.forEach((r) => {
    if (!grouped.has(r.sourceItemId)) {
      grouped.set(r.sourceItemId, new Map());
    }

    grouped.get(r.sourceItemId)!.set(r.targetKey, r.rawValue ?? "");
  });

  const updatedValuesByItem = new Map<string, string[]>();

  grouped.forEach((targetMap, itemId) => {
    const values = targets.map(
      (t) =>
        targetMap.get(t.type === TARGET_TYPE.ATTRIBUTE ? t.id : t.field) ?? "",
    );
    updatedValuesByItem.set(itemId, values);
  });

  const result = await processNormalizationPipeline({
    items,
    colIndex: sourceColIndex,
    targets,
    updatedValuesByItem,
    rawValueByItem,
  });

  if (!result.issues.length) {
    prisma.aiParseResult
      .deleteMany({ where: { sessionId: parsingSessionId } })
      .catch(console.error);
  }

  return result;
};

export const processNormalizationPipeline = async (params: {
  items: any[];
  colIndex: number;
  targets: (MappingTarget | null)[];
  updatedValuesByItem: Map<string, string[]>;
  rawValueByItem: Map<string, string>;
}) => {
  const { items, colIndex, targets, updatedValuesByItem, rawValueByItem } =
    params;

  const { transformedRows, issues: rawIssues } = await buildTransformedRows({
    items,
    colIndex,
    updatedValuesByItem,
    rawValueByItem,
    targets,
  });

  if (transformedRows.length === 0) {
    return { count: 0, issues: [] };
  }

  const issues = await enrichIssuesWithOptions(rawIssues);

  await saveTransformedRows(transformedRows);

  return {
    count: transformedRows.length,
    issues,
  };
};

export const normalizeSingleEntity = async (params: {
  sessionId: string;
  inputs: NormalizeSingleEntity[];
}) => {
  const { sessionId, inputs } = params;

  if (!inputs.length) return [];

  const { values, cacheMap, mappingPlans } =
    await buildSingleNormalizationContext(inputs);

  const data = mappingPlans
    .map((plan, index) => {
      if (!plan) return null;

      const rawValue = values[index] ?? "";

      const normalized = plan.normalizer(rawValue, cacheMap);

      return {
        target: plan.target,
        rawValue,
        normalized,
      };
    })
    .filter((r): r is NormalizedResult => r !== null);

  const result = await createSingleEquipment({
    sessionId,
    normalizedData: data,
  });

  return result;
};

export const resolveNormalizationIssues = async (params: {
  importSessionId: string;
  colIndex: number;
  targets: (MappingTarget | null)[];
  resolutions: {
    attributeId: string;
    rawValue: string;
    normalized: NormalizedValue;
  }[];
  sourceType: "DIRECT" | "AI_PARSE";
  transform?: TransformConfig;
  parsingSessionId?: string;
}) => {
  const {
    importSessionId,
    colIndex,
    targets,
    resolutions,
    sourceType,
    transform,
    parsingSessionId,
  } = params;

  const cacheData = resolutions.map((r) => ({
    attributeId: r.attributeId,
    rawValue: r.rawValue,
    cleanedValue: r.rawValue.toLowerCase().trim(),
    normalized: r.normalized as any,
  }));

  await prisma.normalizationCache.createMany({
    data: cacheData,
    skipDuplicates: true,
  });

  if (sourceType === "AI_PARSE" && parsingSessionId) {
    return applyAiParse({
      importSessionId,
      parsingSessionId,
      sourceColIndex: colIndex,
      targets: targets.filter((t) => t !== null),
    });
  }

  if (transform) {
    return applyColumnTransformation({
      sessionId: importSessionId,
      colIndex,
      transform,
      targets,
    });
  }

  const target = targets.find((t): t is MappingTarget => t !== null);
  if (!target) {
    throw new Error("Target must not be null");
  }

  return mapColumnToAttribute({
    sessionId: importSessionId,
    colIndex,
    target,
  });
};
