import { JsonValue } from "@prisma/client/runtime/client";
import { parseNumbers } from "../transformation/transformers";
import { NormalizedValue, UnnormalizedValue } from "../types";
import { DataType } from "../../../generated/prisma/enums";
import { DATA_TYPE } from "../../../config";

export const normalizeValue = (
  rawValue: string,
  type: DataType,
  attributeId: string,
  cacheMap: Map<string, JsonValue>,
): NormalizedValue | UnnormalizedValue =>
  type === DATA_TYPE.NUMBER
    ? normalizeNumeric(rawValue, attributeId, cacheMap)
    : normalizeStringOrBoolean(rawValue, attributeId, cacheMap);

const normalizeNumeric = (
  rawValue: string,
  attributeId: string,
  cacheMap: Map<string, JsonValue>,
): NormalizedValue | UnnormalizedValue => {
  // Сплит по разделителям,
  // чтобы отдельно обрабатывать части строк вида '1.25"x2"'
  const separators = /[\s]*[xх×][\s]*/;
  const parts = rawValue
    .toLowerCase()
    .split(separators)
    .filter((p) => p.length > 0);

  const normalizedParts = parts.map((part) => {
    const partClean = part.trim();
    const partKey = `${attributeId}:${partClean}`;

    if (isSimpleNumeric(partClean)) {
      const nums = parseNumbers(partClean);
      return { nums, needsCheck: false };
    }

    if (cacheMap.has(partKey)) {
      const cached = cacheMap.get(partKey) as unknown as NormalizedValue;
      const nums = [cached.valueMin, cached.valueMax].filter(
        (v) => v !== undefined,
      );
      return { nums, needsCheck: false };
    }

    return { nums: parseNumbers(partClean), needsCheck: true };
  });

  const allNums = normalizedParts.flatMap((p) => p.nums);
  const needsCheck = normalizedParts.some((p) => p.needsCheck);

  if (needsCheck) {
    return {
      valueString: rawValue.trim(),
      needsCheck,
    };
  }

  return {
    valueString: rawValue.trim(),
    valueMin: allNums.length > 0 ? Math.min(...allNums) : undefined,
    valueMax: allNums.length > 0 ? Math.max(...allNums) : undefined,
    valueArray: allNums.length >= 3 ? allNums : undefined,
  };
};

const normalizeStringOrBoolean = (
  rawValue: string,
  attributeId: string,
  cacheMap: Map<string, JsonValue>,
): NormalizedValue | UnnormalizedValue => {
  const cleaned = rawValue.toLowerCase().trim();
  const key = `${attributeId}:${cleaned}`;
  const cached = cacheMap.get(key);

  return cached
    ? (cached as unknown as NormalizedValue)
    : {
        valueString: rawValue.trim(),
        needsCheck: true,
      };
};

export const isSimpleNumeric = (val: string): boolean => {
  if (!val) return true;

  // Убираем всё, что считаем "нормальным" для числовой колонки:
  // - Числа, точки, запятые
  // - Разделители: /, |, ~, ;, - и прочие разновидности дефисов и тире
  // - Буквы: a-z, A-Z, а-я, А-Я (очистка единиц измерения)
  // - Понятные спецсимволы: °, %, ³, ², Δ, △, μ, Ω
  const residual = val
    .replace(/[0-9.,\s\-\/|~—‐‑‐;]/g, "")
    .replace(/[a-zA-Zа-яА-Я°%³²Δ△μΩ]/g, "");

  // Если осталась пустая строка, значит число "простое":
  // содержит только те символы, которые можно обработать регулярками
  // Если что-то осталось (например, ½, ¼, кавычки и тд) - число "сложное"
  return residual.length === 0;
};
