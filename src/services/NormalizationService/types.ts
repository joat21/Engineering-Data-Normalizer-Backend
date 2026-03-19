import z from "zod";
import { JsonValue } from "@prisma/client/runtime/client";
import {
  attributeTargetSchema,
  normalizedValueSchema,
  systemTargetSchema,
  transformSchema,
} from "../../schemas/normalization";
import { DataType } from "../../types";

export type TransformPayload = string | number | null;

export type TransformConfig = z.infer<typeof transformSchema>;

export type TransformType = TransformConfig["type"];

export type TransformPayloadMap = {
  [T in TransformType]: Extract<TransformConfig, { type: T }> extends {
    payload: infer P;
  }
    ? P
    : undefined;
};

export type NormalizedValue = z.infer<typeof normalizedValueSchema>;

export interface UnnormalizedValue {
  valueString: string;
  needsCheck: true;
}

export type SystemTarget = z.infer<typeof systemTargetSchema>;
export type AttributeTarget = z.infer<typeof attributeTargetSchema>;
export type MappingTarget = SystemTarget | AttributeTarget;

export interface MappingPlan {
  target: MappingTarget;
  normalizer: (
    val: string,
    cache: Map<string, JsonValue>,
  ) => NormalizedValue | UnnormalizedValue;
}

export interface NormalizedResult {
  target: MappingTarget;
  rawValue: string;
  normalized: NormalizedValue;
}

export type TransformedRow = Record<string, NormalizedResult[]>;

export type NormalizeSingleEntity = {
  target: MappingTarget;
  value: string | null | undefined;
};

export interface AttributeInfo {
  dataType: DataType;
  label: string;
}

export const isNormalizedValue = (
  val: NormalizedValue | UnnormalizedValue,
): val is NormalizedValue => {
  return !(val as UnnormalizedValue).needsCheck;
};

export type EnrichedTarget = MappingTarget & {
  label: string;
  dataType: DataType;
};

export interface NormalizationOption {
  id: string;
  label: string;
  normalized: NormalizedValue;
}

export interface NormalizationIssue {
  target: EnrichedTarget;
  unnormalizedValues: string[];
  normalizationOptions: NormalizationOption[];
}
