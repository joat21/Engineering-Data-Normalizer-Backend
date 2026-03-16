import { JsonValue } from "@prisma/client/runtime/client";
import { getCacheMap, getMappingPlans, getTypeMap } from "./helpers";
import { MappingPlan, MappingTarget, TransformedRow } from "./types";
import { prisma } from "../../../prisma/prisma";

export const buildNormalizationContext = async (
  targets: (MappingTarget | null)[],
  valuesByItem: Map<string, string[]>,
) => {
  const typeMap = await getTypeMap(targets);
  const cacheMap = await getCacheMap(targets, valuesByItem, typeMap);
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

export const buildTransformedRows = (
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
      transformedRow: newData,
    };
  });
};

export const saveTransformedRows = async (
  dataToUpdate: { id: string; transformedRow: TransformedRow }[],
) => {
  if (dataToUpdate.length === 0) {
    return { success: true, count: 0 };
  }

  const payload = JSON.stringify(dataToUpdate);

  await prisma.$executeRaw`
    UPDATE "StagingImportItem" AS t
    SET "transformedRow" = v."transformedRow"
    FROM json_to_recordset(${payload}::json) AS v(
      "id" uuid,
      "transformedRow" jsonb
    )
    WHERE t.id = v.id
  `;

  return { success: true, count: dataToUpdate.length };
};
