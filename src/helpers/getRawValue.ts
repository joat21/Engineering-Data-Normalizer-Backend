import { JsonValue } from "@prisma/client/runtime/client";
import { TransformPayload } from "../services/NormalizationService/types";

export const getRawValue = (
  rawRow: JsonValue,
  colIndex: number,
): TransformPayload => {
  if (!Array.isArray(rawRow)) return null;

  const val = rawRow[colIndex];
  return typeof val === "string" || typeof val === "number" || val === null
    ? val
    : null;
};
