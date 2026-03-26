import {
  multiplyNumbersInString,
  parseNumbers,
  splitBySeparator,
  TransformConfig,
  TransformPayload,
  TransformType,
} from "@engineering-data-normalizer/shared";

export const applyTransform = (
  value: TransformPayload,
  transform: TransformConfig,
) => {
  switch (transform.type) {
    case TransformType.EXTRACT_NUMBERS:
      return parseNumbers(String(value));

    case TransformType.SPLIT_BY:
      return splitBySeparator(String(value), transform.payload.separator);

    case TransformType.MULTIPLY:
      return multiplyNumbersInString(String(value), transform.payload.factor);

    default: {
      const _exhaustive: never = transform;
      return _exhaustive;
    }
  }
};
