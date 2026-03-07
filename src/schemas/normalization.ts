import { z } from "zod";

export const transformSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("EXTRACT_NUMBERS") }),
  z.object({
    type: z.literal("SPLIT_BY"),
    payload: z.object({ separator: z.string() }),
  }),
  z.object({
    type: z.literal("MULTIPLY"),
    payload: z.object({ factor: z.number() }),
  }),
]);

export type TransformConfig = z.infer<typeof transformSchema>;

export const applyTransformSchema = z.object({
  body: z.object({
    sessionId: z.uuid(),
    colIndex: z.number(),
    transform: transformSchema,
    attributesOrder: z.array(z.string()),
  }),
});

export const mapColToAttrSchema = z.object({
  body: z.object({
    sessionId: z.uuid(),
    colIndex: z.number(),
    attributeId: z.uuid(),
  }),
});
