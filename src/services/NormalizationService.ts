import { JsonValue } from "@prisma/client/runtime/client";
import { prisma } from "../../prisma/prisma";
import * as TransformUtils from "../helpers/transformers";
import { TransformConfig } from "../schemas/normalization";
import {
  normalizer,
  TransformedColumn,
  TransformedRow,
} from "../helpers/normalizers";

export type TransformType = TransformConfig["type"];

type TransformPayloadMap = {
  [T in TransformType]: Extract<TransformConfig, { type: T }> extends {
    payload: infer P;
  }
    ? P
    : undefined;
};

type TransformStrategyMap = {
  [T in TransformType]: TransformPayloadMap[T] extends undefined
    ? (val: TransformUtils.TransformPayload) => (string | number | null)[]
    : (
        val: TransformUtils.TransformPayload,
        payload: TransformPayloadMap[T],
      ) => (string | number | null)[];
};

const TRANSFORM_STRATEGIES: TransformStrategyMap = {
  EXTRACT_NUMBERS: (val) => TransformUtils.parseNumbers(String(val)),

  SPLIT_BY: (val, payload) =>
    TransformUtils.splitBySeparator(String(val), payload.separator),

  MULTIPLY: (val, payload) => TransformUtils.multiply(val, payload.factor),
};

const applyTransform = (
  value: TransformUtils.TransformPayload,
  transform: TransformConfig,
) => {
  switch (transform.type) {
    case "EXTRACT_NUMBERS":
      return TRANSFORM_STRATEGIES.EXTRACT_NUMBERS(value);

    case "SPLIT_BY":
      return TRANSFORM_STRATEGIES.SPLIT_BY(value, transform.payload);

    case "MULTIPLY":
      return TRANSFORM_STRATEGIES.MULTIPLY(value, transform.payload);

    default: {
      const _exhaustive: never = transform;
      return _exhaustive;
    }
  }
};

export const applyColumnTransformation = async (params: {
  sessionId: string;
  colIndex: number;
  transform: TransformConfig;
  attributesOrder: string[];
}) =>
  processColumnUpdate(params.sessionId, params.colIndex, (rawValue) => {
    const results = applyTransform(rawValue, params.transform);

    return params.attributesOrder.map((attrId, i) => ({
      attributeId: attrId,
      rawValue: String(rawValue),
      normalized: normalizer(String(results[i])),
    }));
  });

export const mapColumnToAttribute = async (params: {
  sessionId: string;
  colIndex: number;
  attributeId: string;
}) =>
  processColumnUpdate(params.sessionId, params.colIndex, (rawValue) => {
    return [
      {
        attributeId: params.attributeId,
        rawValue: String(rawValue),
        normalized: normalizer(String(rawValue)),
      },
    ];
  });

const processColumnUpdate = async (
  sessionId: string,
  colIndex: number,
  getColumnData: (rawValue: any) => TransformedColumn[],
) => {
  const items = await prisma.stagingImportItem.findMany({
    where: { sessionId },
    select: { id: true, rawRow: true, transformedRow: true },
  });

  const dataToUpdate = items.map((item) => {
    const rawValue = getRawValue(item.rawRow, colIndex);

    const columnMappings = getColumnData(rawValue);

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

  if (dataToUpdate.length === 0) return { success: true, count: 0 };

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

const getRawValue = (
  rawRow: JsonValue,
  colIndex: number,
): TransformUtils.TransformPayload => {
  if (!Array.isArray(rawRow)) return null;

  const val = rawRow[colIndex];
  return typeof val === "string" || typeof val === "number" || val === null
    ? val
    : null;
};
