import {
  getCacheMap,
  getCacheMapFromValues,
  getMappingPlans,
  getTypeMap,
} from "./helpers";
import { applyTransform } from "./transformers";
import {
  MappingTarget,
  TransformedRow,
  TransformConfig,
  MappingPlan,
} from "./types";
import { prisma } from "../../../prisma/prisma";
import { getRawValue } from "../../helpers/getRawValue";
import { JsonValue } from "@prisma/client/runtime/client";
import { TARGET_TYPE } from "../../config";

export const mapColumnToAttribute = async (params: {
  sessionId: string;
  colIndex: number;
  target: MappingTarget;
}) =>
  updateColumn(
    params.sessionId,
    params.colIndex,
    [params.target],
    (rawValue) => [rawValue],
  );

export const applyColumnTransformation = async (params: {
  sessionId: string;
  colIndex: number;
  transform: TransformConfig;
  targets: (MappingTarget | null)[];
}) =>
  updateColumn(params.sessionId, params.colIndex, params.targets, (rawValue) =>
    applyTransform(rawValue, params.transform),
  );

const updateColumn = async (
  sessionId: string,
  colIndex: number,
  targets: (MappingTarget | null)[],
  getUpdatedData: (rawValue: any) => any[],
) => {
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

  const { cacheMap, mappingPlans } = await buildNormalizationContext(
    targets,
    updatedValuesByItem,
  );

  const dataToUpdate = buildTransformedRows(
    items,
    colIndex,
    updatedValuesByItem,
    rawValueByItem,
    mappingPlans,
    cacheMap,
  );

  return saveTransformedRows(dataToUpdate);
};

export const applyAiExtraction = async (params: {
  importSessionId: string;
  parsingSessionId: string;
  sourceColIndex: number;
  targets: MappingTarget[];
}) => {
  const { importSessionId, parsingSessionId, sourceColIndex, targets } = params;

  const aiRows = await prisma.aiExtractionResult.findMany({
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

    grouped.get(r.sourceItemId)!.set(r.target, r.rawValue ?? "");
  });

  const updatedValuesByItem = new Map<string, string[]>();

  grouped.forEach((targetMap, itemId) => {
    const values = targets.map(
      (t) =>
        targetMap.get(t.type === TARGET_TYPE.ATTRIBUTE ? t.id : t.field) ?? "",
    );
    updatedValuesByItem.set(itemId, values);
  });

  const { cacheMap, mappingPlans } = await buildNormalizationContext(
    targets,
    updatedValuesByItem,
  );

  const dataToUpdate = buildTransformedRows(
    items,
    sourceColIndex,
    updatedValuesByItem,
    rawValueByItem,
    mappingPlans,
    cacheMap,
  );

  return saveTransformedRows(dataToUpdate);
};

const buildNormalizationContext = async (
  targets: (MappingTarget | null)[],
  valuesByItem: Map<string, string[]>,
) => {
  const typeMap = await getTypeMap(targets);
  const cacheMap = await getCacheMapFromValues(targets, valuesByItem, typeMap);
  const mappingPlans = getMappingPlans(targets, typeMap);

  return {
    typeMap,
    cacheMap,
    mappingPlans,
  };
};

const buildColumnMappings = (
  rawValue: any,
  values: any[],
  mappingPlans: (MappingPlan | null)[],
  cacheMap: Map<string, JsonValue>,
) => {
  return mappingPlans
    .map((plan, i) => {
      if (!plan) return null;

      const valueToNormalize = String(values[i] ?? "");
      return {
        target: plan.target,
        rawValue: String(rawValue),
        normalized: plan.normalizer(valueToNormalize, cacheMap),
      };
    })
    .filter((m) => m !== null);
};

const buildTransformedRows = (
  items: {
    id: string;
    rawRow: JsonValue;
    transformedRow: JsonValue;
  }[],
  colIndex: number,
  updatedValuesByItem: Map<string, string[]>,
  rawValueByItem: Map<string, string>,
  mappingPlans: (MappingPlan | null)[],
  cacheMap: Map<string, JsonValue>,
) => {
  return items.map((item) => {
    const rawValue = rawValueByItem.get(item.id) || "";
    const values = updatedValuesByItem.get(item.id) || [];

    const columnMappings = buildColumnMappings(
      rawValue,
      values,
      mappingPlans,
      cacheMap,
    );

    const existingRow =
      (item.transformedRow as unknown as TransformedRow) || {};

    const newData: TransformedRow = {
      ...existingRow,
      [colIndex.toString()]: columnMappings,
    };

    return {
      id: item.id,
      transformedRow: JSON.stringify(newData).replace(/'/g, "''"),
    };
  });
};

const saveTransformedRows = async (
  dataToUpdate: { id: string; transformedRow: string }[],
) => {
  if (dataToUpdate.length === 0) {
    return { success: true, count: 0 };
  }

  const values = dataToUpdate
    .map((d) => `('${d.id}'::uuid, '${d.transformedRow}'::jsonb)`)
    .join(",");

  await prisma.$executeRawUnsafe(`
    UPDATE "StagingImportItem" AS t
    SET "transformedRow" = v.new_val
    FROM (VALUES ${values}) AS v(id, new_val)
    WHERE t.id = v.id;
  `);

  return { success: true, count: dataToUpdate.length };
};
