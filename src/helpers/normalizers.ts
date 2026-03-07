import { parseNumbers } from "./transformers";

export interface NormalizedValue {
  valueString: string;
  valueMin?: number;
  valueMax?: number;
  valueArray?: number[];
  valueBoolean?: boolean;
}

export interface TransformedColumn {
  attributeId: string;
  rawValue: string;
  normalized: NormalizedValue;
}

export type TransformedRow = Record<string, TransformedColumn[]>;

export const normalizer = (rawValue: string): NormalizedValue => {
  const result: NormalizedValue = {
    valueString: rawValue,
  };

  const nums = parseNumbers(rawValue);

  if (nums.length > 0) {
    result.valueMin = Math.min(...nums);
    result.valueMax = Math.max(...nums);

    if (nums.length >= 3) {
      result.valueArray = nums;
    }
  }

  return result;
};
