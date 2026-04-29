import { z } from "zod";
import { DataType } from "../category";
import {
  applyTransformSchema,
  attributeTargetSchema,
  mapColToAttrSchema,
  normalizedDataSchema,
  normalizedValueSchema,
  resolveNormalizationIssuesSchema,
  systemTargetSchema,
  transformConfigSchema,
} from "./schemas";
import type { SYSTEM_FIELDS_CONFIG } from "./constants";

export type NormalizedValue = z.infer<typeof normalizedValueSchema>;
export type NormalizedData = z.infer<typeof normalizedDataSchema>;

export type SystemTarget = z.infer<typeof systemTargetSchema>;
export type AttributeTarget = z.infer<typeof attributeTargetSchema>;
export type MappingTarget = SystemTarget | AttributeTarget;

export const MappingTargetType = {
  SYSTEM: "SYSTEM",
  ATTRIBUTE: "ATTRIBUTE",
} as const;

export type MappingTargetType =
  (typeof MappingTargetType)[keyof typeof MappingTargetType];

export type TransformPayload = string | number | null;

export const TransformType = {
  EXTRACT_NUMBERS: "EXTRACT_NUMBERS",
  SPLIT_BY: "SPLIT_BY",
  MULTIPLY: "MULTIPLY",
} as const;

export type TransformType = (typeof TransformType)[keyof typeof TransformType];

export type TransformConfig = z.infer<typeof transformConfigSchema>;

export const OperationType = {
  MULTIPLY: "multiply",
  DIVIDE: "divide",
} as const;

export type OperationType = (typeof OperationType)[keyof typeof OperationType];

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

export interface MapTransformResult {
  count: number;
  issues: NormalizationIssue[];
}

export const PrevActionType = {
  DIRECT: "DIRECT",
  AI_PARSE: "AI_PARSE",
};

export type PrevActionType =
  (typeof PrevActionType)[keyof typeof PrevActionType];

export const FieldContext = {
  IMPORT: "import", // Единичный и массовый импорты
  FILTERS: "filters", // Фильтры + таблица поиска
  FTS: "fts", // Полнотекстовый поиск
  COMPARISON: "comparison", // Сравнение
  AI: "ai", // Извлечение данных с помощью ИИ
  CATEGORY_DIRECTORY: "category_directory", // справочник атрибутов категории
} as const;

export type FieldContext = (typeof FieldContext)[keyof typeof FieldContext];

export type SystemFieldKey = keyof typeof SYSTEM_FIELDS_CONFIG;

export interface SystemFieldMetadata {
  label: string;
  type: DataType;
  unit?: string;
  contexts?: FieldContext[];
  excludeContexts?: FieldContext[];
}

export type SystemFieldsConfig = Record<SystemFieldKey, SystemFieldMetadata>;

export type MapColToAttrParams = z.infer<
  typeof mapColToAttrSchema.shape.params
>;
export type MapColToAttrBody = z.infer<typeof mapColToAttrSchema.shape.body>;

export type ApplyTransformParams = z.infer<
  typeof applyTransformSchema.shape.params
>;
export type ApplyTransformBody = z.infer<
  typeof applyTransformSchema.shape.body
>;

export type ResolveNormalizationIssuesParams = z.infer<
  typeof resolveNormalizationIssuesSchema.shape.params
>;
export type ResolveNormalizationIssuesBody = z.infer<
  typeof resolveNormalizationIssuesSchema.shape.body
>;
