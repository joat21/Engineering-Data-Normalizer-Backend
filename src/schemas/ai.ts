import z from "zod";
import { SYSTEM_FIELD_KEYS, TARGET_TYPE } from "../config";
import { mappingTargetSchema } from "./normalization";

export const aiParseTargetSchema = z.object({
  type: z.enum(TARGET_TYPE),
  key: z.enum(SYSTEM_FIELD_KEYS).or(z.uuid()),
  label: z.string(),
});

export const aiParseSchema = z.object({
  body: z.object({
    importSessionId: z.uuid(),
    colIndex: z.number(),
    targets: z.array(aiParseTargetSchema),
    testRowIndexes: z.array(z.number()).optional(),
  }),
});

export const saveAiParseSchema = z.object({
  body: z.object({
    importSessionId: z.uuid(),
    parsingSessionId: z.uuid(),
    sourceColIndex: z.number(),
    targets: z.array(mappingTargetSchema),
  }),
});
