import z from "zod";
import {
  aiParseSchema,
  aiParseTargetSchema,
  editAiParseResultsSchema,
  editedAiParseResultSchema,
  parseFileSchema,
  saveAiParseSchema,
} from "./schemas";

export type AIParseTarget = z.infer<typeof aiParseTargetSchema>;
export type EditedAiParseResult = z.infer<typeof editedAiParseResultSchema>;

export type AiParseBody = z.infer<typeof aiParseSchema.shape.body>;

export type AiParseColumnResult = {
  parsingSessionId: string;
  sourceColIndex: number;
  headers: AIParseTarget[];
  rows: {
    id: string;
    sourceString: string;
    values: any[];
  }[];
};

export type SaveAiParseResultsParams = z.infer<
  typeof saveAiParseSchema.shape.params
>;
export type SaveAiParseResultsBody = z.infer<
  typeof saveAiParseSchema.shape.body
>;

export type EditAiParseResultsParams = z.infer<
  typeof editAiParseResultsSchema.shape.params
>;
export type EditAiParseResultsBody = z.infer<
  typeof editAiParseResultsSchema.shape.body
>;

export type ParseFileParams = z.infer<typeof parseFileSchema.shape.params>;
