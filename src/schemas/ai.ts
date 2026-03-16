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
    parsingSessionId: z.uuid().optional(),
    colIndex: z.number(),
    targets: z.array(aiParseTargetSchema),
    testRowIds: z.array(z.uuid()).min(1),
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

export const editedAiParseResult = z.object({
  sourceItemId: z.uuid(),
  targetKey: z.enum(SYSTEM_FIELD_KEYS).or(z.uuid()),
  newRawValue: z.string(),
});

export const editAiParseResultsSchema = z.object({
  params: z.object({
    sessionId: z.uuid(),
  }),
  body: z.object({
    editedValues: z.array(editedAiParseResult),
  }),
});
