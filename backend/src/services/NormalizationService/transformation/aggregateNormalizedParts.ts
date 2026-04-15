import { NormalizedValue } from "@engineering-data-normalizer/shared";
import { isNormalizedValue, UnnormalizedValue } from "../types";

export const aggregateNormalizedParts = (
  parts: Array<NormalizedValue | UnnormalizedValue>,
  originalRawValue: string,
): NormalizedValue => {
  const allNums: number[] = [];
  let combinedBoolean: boolean | undefined = undefined;

  for (const part of parts) {
    if (!isNormalizedValue(part)) continue;

    if (part.valueArray) {
      allNums.push(...part.valueArray);
    } else {
      // Собираем все числа. Если у куска только одно число (min === max),
      // пушим его один раз, чтобы не задваивать.
      if (part.valueMin !== undefined) allNums.push(part.valueMin);
      if (part.valueMax !== undefined && part.valueMax !== part.valueMin) {
        allNums.push(part.valueMax);
      }
    }

    // Если это булево значение, просто берем его
    if (part.valueBoolean !== undefined) {
      combinedBoolean = part.valueBoolean;
    }
  }

  // Формируем финальный объект, который строго соответствует NormalizedValue
  return {
    valueString: originalRawValue, // Например: '1.25"x2"'
    valueMin: allNums.length > 0 ? Math.min(...allNums) : undefined,
    valueMax: allNums.length > 0 ? Math.max(...allNums) : undefined,
    valueArray: allNums.length >= 3 ? allNums : undefined,
    valueBoolean: combinedBoolean,
  };
};
