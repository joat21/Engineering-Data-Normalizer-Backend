import { JsonValue } from "@prisma/client/runtime/client";
import {
  DataType,
  NormalizedValue,
  parseNumbers,
} from "@engineering-data-normalizer/shared";
import { UnnormalizedValue } from "../types";
import { DIMENSION_SEPARATORS_REGEX } from "../../../config";
import { isSimpleNumeric } from "../../../helpers/isSimpleNumeric";
import { cleanValue } from "../../../helpers/cleanValue";

export const normalizeValue = (
  rawValue: string,
  type: DataType,
  attributeId: string,
  cacheMap: Map<string, JsonValue>,
): Array<NormalizedValue | UnnormalizedValue> =>
  type === DataType.NUMBER
    ? normalizeNumeric(rawValue, attributeId, cacheMap)
    : [normalizeStringOrBoolean(rawValue, attributeId, cacheMap)];

const normalizeNumeric = (
  rawValue: string,
  attributeId: string,
  cacheMap: Map<string, JsonValue>,
): Array<NormalizedValue | UnnormalizedValue> => {
  // Сплит по разделителям размерности,
  // чтобы отдельно обрабатывать части строк вида '1.25"x2"'
  const parts = rawValue
    .split(DIMENSION_SEPARATORS_REGEX)
    .filter((p) => p.length > 0);

  // возврат массива,
  // чтобы не потерять части составных значений (например, если 1.25" из 1.25"x2" нормализовать не удалось)
  return parts.map((part) => {
    // сохраняем отдельно исходную строку, чтобы вернуть ее без lowerCase
    const trimmedPart = part.trim();
    const partClean = trimmedPart.toLowerCase();
    const partKey = `${attributeId}:${partClean}`;

    if (isSimpleNumeric(partClean)) {
      const nums = parseNumbers(partClean);
      return {
        valueString: trimmedPart,
        valueMin: nums.length > 0 ? Math.min(...nums) : undefined,
        valueMax: nums.length > 0 ? Math.max(...nums) : undefined,
        valueArray: nums.length >= 3 ? nums : undefined,
      } as NormalizedValue;
    }

    if (cacheMap.has(partKey)) {
      const cached = cacheMap.get(partKey) as unknown as NormalizedValue;
      return {
        valueString: trimmedPart,
        valueMin: cached.valueMin,
        valueMax: cached.valueMax,
        valueArray: cached.valueArray,
      } as NormalizedValue;
    }

    return {
      valueString: trimmedPart,
      needsCheck: true,
    } as UnnormalizedValue;
  });
};

const normalizeStringOrBoolean = (
  rawValue: string,
  attributeId: string,
  cacheMap: Map<string, JsonValue>,
): NormalizedValue | UnnormalizedValue => {
  const cleaned = cleanValue(rawValue);
  const key = `${attributeId}:${cleaned}`;
  const cached = cacheMap.get(key);

  return cached
    ? (cached as unknown as NormalizedValue)
    : {
        valueString: rawValue.trim(),
        needsCheck: true,
      };
};
