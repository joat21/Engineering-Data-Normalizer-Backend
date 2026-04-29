import { OperationType, TransformPayload } from "./types";

const numberRegex = /\d+(?:[.,]\d+)?/g;

export const parseNumbers = (input: TransformPayload): number[] => {
  if (!input) return [];

  return (String(input).match(numberRegex) || []).map((n) =>
    Number(n.replace(",", ".")),
  );
};

export const splitBySeparator = (
  input: TransformPayload,
  separator: string,
): string[] => {
  if (!input) return [];

  return String(input)
    .split(separator)
    .map((s) => s.trim())
    .filter(Boolean);
};

export const multiply = (input: TransformPayload, factor: number) => {
  if (!input) return [];

  const nums = parseNumbers(input);
  return nums.map((n) => n * factor);
};

// 12 знаков достаточно для любой инженерки, и это отрежет погрешность JS
export const MAX_PRECISION = 12;

export const multiplyNumbersInString = (
  input: TransformPayload,
  operation: OperationType,
  value: number,
): string[] => {
  if (!input) return [];

  const res = String(input).replace(numberRegex, (match) => {
    const num = parseFloat(match.replace(",", "."));
    const transformed =
      operation === OperationType.MULTIPLY ? num * value : num / value;

    return new Intl.NumberFormat("en-US", {
      useGrouping: false,
      maximumFractionDigits: MAX_PRECISION,
    }).format(transformed);
  });

  return [res];
};
