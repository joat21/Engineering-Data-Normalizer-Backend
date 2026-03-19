import { array, z } from "zod";
import { SYSTEM_FIELD_KEYS, TARGET_TYPE, TRANSFORM_TYPE } from "../config";

export const transformSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal(TRANSFORM_TYPE.EXTRACT_NUMBERS) }),
  z.object({
    type: z.literal(TRANSFORM_TYPE.SPLIT_BY),
    payload: z.object({ separator: z.string() }),
  }),
  z.object({
    type: z.literal(TRANSFORM_TYPE.MULTIPLY),
    payload: z.object({ factor: z.number() }),
  }),
]);

export const systemTargetSchema = z.object({
  type: z.literal(TARGET_TYPE.SYSTEM),
  field: z.enum(SYSTEM_FIELD_KEYS),
});
export const attributeTargetSchema = z.object({
  type: z.literal(TARGET_TYPE.ATTRIBUTE),
  id: z.uuid(),
});

export const mappingTargetSchema = z.discriminatedUnion("type", [
  systemTargetSchema,
  attributeTargetSchema,
]);

export const applyTransformSchema = z.object({
  params: z.object({
    sessionId: z.uuid(),
  }),
  body: z.object({
    colIndex: z.number(),
    transform: transformSchema,
    targets: z.array(mappingTargetSchema.nullable()),
  }),
});

export const mapColToAttrSchema = z.object({
  params: z.object({
    sessionId: z.uuid(),
  }),
  body: z.object({
    colIndex: z.number(),
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

export const normalizedValueSchema = z.object({
  valueString: z.string(),
  valueMin: z.number().optional(),
  valueMax: z.number().optional(),
  valueArray: z.array(z.number()).optional(),
  valueBoolean: z.boolean().optional(),
});

export const resolveNormalizationIssuesSchema = z.object({
  params: z.object({
    sessionId: z.uuid(),
  }),
  body: z.object({
    colIndex: z.number(),
    targets: z.array(mappingTargetSchema.nullable()),
    resolutions: z.array(
      z.object({
        attributeId: z.uuid(),
        rawValue: z.string(),
        normalized: normalizedValueSchema,
      }),
    ),
    sourceType: z.enum(["DIRECT", "AI_PARSE"]),
    transform: transformSchema.optional(),
    parsingSessionId: z.uuid().optional(),
  }),
});
