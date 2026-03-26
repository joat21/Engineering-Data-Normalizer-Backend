import {
  DataType,
  EnrichedTarget,
  MappingTarget,
} from "@engineering-data-normalizer/shared";
import { JsonValue } from "@prisma/client/runtime/client";
import { isNormalizedValue, MappingPlan, TransformedRow } from "../types";
import { prisma } from "../../../prisma";
import { buildBatchNormalizationContext } from "../normalization/context";
import { getTargetKey } from "../../../helpers/getTargetKey";

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

export const buildTransformedRows = async (params: {
  items: {
    id: string;
    rawRow: JsonValue;
    transformedRow: JsonValue;
  }[];
  colIndex: number;
  targets: (MappingTarget | null)[];
  updatedValuesByItem: Map<string, string[]>;
  rawValueByItem: Map<string, string>;
}) => {
  const { items, colIndex, targets, updatedValuesByItem, rawValueByItem } =
    params;

  const issuesMap = new Map<
    string,
    {
      target: EnrichedTarget;
      unnormalizedValues: Set<string>;
    }
  >();

  const { attributeInfoMap, cacheMap, mappingPlans } =
    await buildBatchNormalizationContext(targets, updatedValuesByItem);

  const transformedRows = items.map((item) => {
    const rawValue = rawValueByItem.get(item.id) || "";
    const values = updatedValuesByItem.get(item.id) || [];

    const columnMappings = buildColumnMappings(
      rawValue,
      values,
      mappingPlans,
      cacheMap,
    );

    for (const mapping of columnMappings) {
      if (isNormalizedValue(mapping.normalized)) continue;

      const target = mapping.target;
      const targetKey = getTargetKey(target);

      if (!issuesMap.has(targetKey)) {
        issuesMap.set(targetKey, {
          target: {
            ...target,
            label:
              attributeInfoMap.get(targetKey)?.label || "Неизвестный атрибут",
            dataType:
              attributeInfoMap.get(targetKey)?.dataType || DataType.STRING,
          },
          unnormalizedValues: new Set<string>(),
        });
      }

      const valueToAdd = mapping.normalized.valueString;
      issuesMap.get(targetKey)?.unnormalizedValues.add(valueToAdd);
    }

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

  return {
    transformedRows,
    issues: Array.from(issuesMap.values()).map((v) => ({
      ...v,
      unnormalizedValues: Array.from(v.unnormalizedValues),
    })),
  };
};

export const saveTransformedRows = async (
  transformedRows: { id: string; transformedRow: TransformedRow }[],
) => {
  const payload = JSON.stringify(transformedRows);

  await prisma.$executeRaw`
    UPDATE "StagingImportItem" AS t
    SET "transformedRow" = v."transformedRow"
    FROM json_to_recordset(${payload}::json) AS v(
      "id" uuid,
      "transformedRow" jsonb
    )
    WHERE t.id = v.id
  `;
};
