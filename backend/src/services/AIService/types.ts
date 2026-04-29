import { AIParseTarget } from "@engineering-data-normalizer/shared";

export type AiBatchParseResult = {
  rowId: string;
  sourceString: string;
  extracted: Record<string, string | number | boolean | null>;
};

export type AiSingleParseResult = Record<string, string | null>;

export type AiBatchParseResultData = AiParseResultData<AiBatchParseResult[]>;

export type AiSingleParseResultData = AiParseResultData<AiSingleParseResult>;

export type AiParseResultData<T> = {
  tokensUsage: object | string;
  parsed: T;
  responseText: string;
  modelName: string;
};

export type ExtendedAIParseTarget = AIParseTarget & {
  attributeId?: string;
};

export interface AiExample {
  sourceString: string;
  results: Record<string, string | null>;
}
