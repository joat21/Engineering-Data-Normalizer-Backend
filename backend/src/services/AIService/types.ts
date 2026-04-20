export type AiBatchParseResult = {
  rowId: string;
  sourceString: string;
  extracted: Record<string, string | number | boolean | null>;
};

export type AiSingleParseResult = Record<string, string>;

export type AiBatchParseResultData = AiParseResultData<AiBatchParseResult[]>;

export type AiSingleParseResultData = AiParseResultData<AiSingleParseResult>;

export type AiParseResultData<T> = {
  tokensUsage: object | string;
  parsed: T;
  responseText: string;
  modelName: string;
};
