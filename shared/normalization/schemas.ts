import { z } from "zod";
import { SYSTEM_FIELD_KEYS } from "./constants";
import {
  MappingTargetType,
  OperationType,
  PrevActionType,
  TransformType,
} from "./types";

export const normalizedValueSchema = z.object({
  valueString: z.string(),
  valueMin: z.number().optional(),
  valueMax: z.number().optional(),
  valueArray: z.array(z.number()).optional(),
  valueBoolean: z.boolean().optional(),
});

export const systemTargetSchema = z.object({
  type: z.literal(MappingTargetType.SYSTEM),
  field: z.enum(SYSTEM_FIELD_KEYS),
});
export const attributeTargetSchema = z.object({
  type: z.literal(MappingTargetType.ATTRIBUTE),
  id: z.uuid(),
});

export const mappingTargetSchema = z.discriminatedUnion("type", [
  systemTargetSchema,
  attributeTargetSchema,
]);

export const normalizedDataSchema = z.object({
  target: mappingTargetSchema,
  rawValue: z.string(),
  normalized: normalizedValueSchema,
});

export const transformConfigSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal(TransformType.EXTRACT_NUMBERS) }),
  z.object({
    type: z.literal(TransformType.SPLIT_BY),
    payload: z.object({ separator: z.string() }),
  }),
  z.object({
    type: z.literal(TransformType.MULTIPLY),
    payload: z.object({ operation: z.enum(OperationType), value: z.number() }),
  }),
]);

export const applyTransformSchema = z.object({
  params: z.object({
    sessionId: z.uuid(),
  }),
  body: z.object({
    colIndex: z.number(),
    subIndex: z.number().optional(),
    transform: transformConfigSchema,
    targets: z.array(mappingTargetSchema.nullable()),
  }),
});

export const mapColToAttrSchema = z.object({
  params: z.object({
    sessionId: z.uuid(),
  }),
  body: z.object({
    colIndex: z.number(),
    subIndex: z.number().optional(),
    target: mappingTargetSchema,
  }),
});

export const normalizeSingleEntitySchema = z.object({
  body: z.object({
    sessionId: z.uuid(),
    inputs: z.array(
      z.object({
        target: mappingTargetSchema,
        value: z.string().nullable(),
      }),
    ),
  }),
});

export const resolveNormalizationIssuesSchema = z.object({
  params: z.object({
    sessionId: z.uuid(),
  }),
  body: z.object({
    colIndex: z.number(),
    targets: z.array(mappingTargetSchema.nullable()),
    resolutions: z.array(normalizedDataSchema),
    prevActionType: z.enum(PrevActionType),
    transform: transformConfigSchema.optional(),
    parsingSessionId: z.uuid().optional(),
  }),
});
