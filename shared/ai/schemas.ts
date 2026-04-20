import z from "zod";
import { mappingTargetSchema, MappingTargetType } from "../normalization";

export const aiParseTargetSchema = z.object({
  type: z.enum(MappingTargetType),
  key: z.string(),
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
  params: z.object({
    sessionId: z.uuid(),
  }),
  body: z.object({
    importSessionId: z.uuid(),
    sourceColIndex: z.number(),
    targets: z.array(mappingTargetSchema),
  }),
});

export const editedAiParseResultSchema = z.object({
  sourceItemId: z.uuid(),
  targetKey: z.string(),
  newRawValue: z.string(),
});

export const editAiParseResultsSchema = z.object({
  params: z.object({
    sessionId: z.uuid(),
  }),
  body: z.object({
    editedValues: z.array(editedAiParseResultSchema),
  }),
});

export const parseFileSchema = z.object({
  params: z.object({
    importSessionId: z.string(),
  }),
});
