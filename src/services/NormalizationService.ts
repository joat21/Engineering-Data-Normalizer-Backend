import { JsonValue } from "@prisma/client/runtime/client";
import { prisma } from "../../prisma/prisma";
import * as TransformUtils from "../helpers/transformers";
import { TransformConfig } from "../schemas/normalization";

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
}) => {
  const items = await prisma.stagingImportItem.findMany({
    where: { sessionId: params.sessionId },
  });

  const updates = items.map((item) => {
    const rawValue = getRawValue(item.rawRow, params.colIndex);
    const results = applyTransform(rawValue, params.transform);

    const existingData = (item.transformedRow as Record<string, any>) || {};
    const newData = { ...existingData };
    params.attributesOrder.forEach((attrId, i) => {
      newData[attrId] = results[i] ?? null;
    });

    return prisma.stagingImportItem.update({
      where: { id: item.id },
      data: { transformedRow: newData },
    });
  });

  return await prisma.$transaction(updates);
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
