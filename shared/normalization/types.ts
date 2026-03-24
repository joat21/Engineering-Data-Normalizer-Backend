import { z } from "zod";
import { DataType } from "../category";
import { SYSTEM_FIELDS_CONFIG } from "./constants";
import {
  attributeTargetSchema,
  mapColToAttrSchema,
  normalizedDataSchema,
  normalizedValueSchema,
  systemTargetSchema,
} from "./schemas";

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

export type EquipmentSystemFieldsDTO = {
  [K in keyof typeof SYSTEM_FIELDS_CONFIG]: (typeof SYSTEM_FIELDS_CONFIG)[K]["type"] extends typeof DataType.NUMBER
    ? number
    : (typeof SYSTEM_FIELDS_CONFIG)[K]["type"] extends typeof DataType.BOOLEAN
      ? boolean
      : string;
};

export const TransformType = {
  EXTRACT_NUMBERS: "EXTRACT_NUMBERS",
  SPLIT_BY: "SPLIT_BY",
  MULTIPLY: "MULTIPLY",
} as const;

export type TransformType = (typeof TransformType)[keyof typeof TransformType];

export type MapColToAttrParams = z.infer<
  typeof mapColToAttrSchema.shape.params
>;
export type MapColToAttrBody = z.infer<typeof mapColToAttrSchema.shape.body>;
