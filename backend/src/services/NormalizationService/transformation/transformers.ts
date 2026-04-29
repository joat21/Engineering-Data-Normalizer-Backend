import {
  multiplyNumbersInString,
  OperationType,
  parseNumbers,
  splitBySeparator,
  TransformConfig,
  TransformPayload,
  TransformType,
} from "@engineering-data-normalizer/shared";
import { ApiError } from "../../../exceptions/api-error";

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
      const { payload } = transform;

      if (payload.value === 0) {
        const operand =
          payload.operation === OperationType.MULTIPLY
            ? "Множитель"
            : "Делитель";

        throw ApiError.BadRequest(`${operand} не может быть равен нулю`);
      }

      return multiplyNumbersInString(
        String(value),
        payload.operation,
        payload.value,
      );

    default: {
      const _exhaustive: never = transform;
      return _exhaustive;
    }
  }
};
