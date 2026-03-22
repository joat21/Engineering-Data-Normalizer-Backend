import { JsonValue } from "@prisma/client/runtime/client";
import {
  AttributeInfo,
  MappingPlan,
  MappingTarget,
  NormalizeSingleEntity,
} from "../types";
import { prisma } from "../../../prisma";
import { DATA_TYPE, TARGET_TYPE } from "../../../config";
import { normalizeValue } from "./normalizers";
import { cleanValue } from "../../../helpers/cleanValue";
import { getCacheableCleanedValues, getCacheKey } from "../../../helpers/cache";
import { getAttributeInfoMap } from "../../../db/categoryAttribute";

export const buildBatchNormalizationContext = async (
  targets: (MappingTarget | null)[],
  valuesByItem: Map<string, string[]>,
) => {
  return buildNormalizationContext(targets, valuesByItem);
};

export const buildSingleNormalizationContext = async (
  inputs: NormalizeSingleEntity[],
) => {
  // при нормализации данных из колонки targets приходят с фронта отдельно,
  // и values под них собираются на ходу из БД, чтобы не делать этого на фронте
  // для нормализации одной сущности (через заполнение формы на фронте)
  // удобно сразу присылать с фронта массив { target, value }[]
  // и для переиспользования существующего кода разделить его на targets[] и values[]
  const targets = inputs.map((i) => i.target);
  const values = inputs.map((i) => String(i.value ?? "").trim());

  // при нормализации колонки: item - это строка таблицы, batch обработка
  // при нормализации одной сущности есть только один item, так как нет таблицы
  // Эмулируем batch-структуру, так как ее ожидает getCacheMap внутри buildNormalizationContext
  const valuesByItem = new Map<string, string[]>();
  valuesByItem.set("single", values);

  const context = await buildNormalizationContext(targets, valuesByItem);

  return { values, ...context };
};

const buildNormalizationContext = async (
  targets: (MappingTarget | null)[],
  valuesByItem: Map<string, string[]>,
) => {
  const attributeInfoMap = await getAttributeInfoMap(targets);
  const cacheMap = await getCacheMap(targets, valuesByItem, attributeInfoMap);
  const mappingPlans = getMappingPlans(targets, attributeInfoMap);

  return {
    attributeInfoMap,
    cacheMap,
    mappingPlans,
  };
};

export const getCacheMap = async (
  targets: (MappingTarget | null)[],
  valuesByItem: Map<string, string[]>,
  attributeInfoMap: Map<string, AttributeInfo>,
) => {
  if (attributeInfoMap.size === 0) {
    return new Map<string, JsonValue>();
  }

  const cacheLookupSet = new Set<string>();

  for (const values of valuesByItem.values()) {
    targets.forEach((target, i) => {
      if (!target || target.type !== TARGET_TYPE.ATTRIBUTE) return;

      const val = cleanValue(String(values[i] ?? ""));
      let attrType = attributeInfoMap.get(target.id)?.dataType;

      if (!attrType) {
        console.log(
          `[LOG]: Attribute type for value ${val} not found. Set attribute type to ${DATA_TYPE.STRING}`,
        );
        attrType = DATA_TYPE.STRING;
      }

      const cacheableValues = getCacheableCleanedValues(val, attrType);
      cacheableValues.forEach((val) => {
        cacheLookupSet.add(`${target.id}:${val}`);
      });
    });
  }

  if (cacheLookupSet.size === 0) return new Map();

  const cacheEntries = await prisma.normalizationCache.findMany({
    where: {
      OR: Array.from(cacheLookupSet).map((pair) => {
        const [attrId, clean] = pair.split(":");
        return { attributeId: attrId, cleanedValue: clean };
      }),
    },
  });

  return new Map(
    cacheEntries.map((e) => [
      getCacheKey(e.attributeId, e.cleanedValue),
      e.normalized,
    ]),
  );
};

export const getMappingPlans = (
  targets: (MappingTarget | null)[],
  attributeInfoMap: Map<string, AttributeInfo>,
): (MappingPlan | null)[] => {
  return targets.map((target) => {
    if (!target) return null;

    if (target.type === TARGET_TYPE.SYSTEM) {
      return {
        target,
        normalizer: (val: string) => ({ valueString: val }),
      };
    }

    return {
      target,
      normalizer: (val: string, cache: Map<string, JsonValue>) =>
        normalizeValue(
          val,
          attributeInfoMap.get(target.id)?.dataType || DATA_TYPE.STRING,
          target.id,
          cache,
        ),
    };
  });
};
