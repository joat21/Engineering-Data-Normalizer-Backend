import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../prisma";
import {
  DATA_TYPE,
  SYSTEM_FIELD_KEYS,
  SYSTEM_FIELDS,
  TARGET_TYPE,
} from "../../config";
import { Prisma } from "../../generated/prisma/client";
import { EquipmentSystemFields } from "../../types";
import { NormalizedData } from "../NormalizationService/types";
import { getCacheableCleanedValues } from "../../helpers/cache";
import {
  BooleanFilterValue,
  FilterValue,
  NumericFilterValue,
  StringFilterValue,
} from "./types";
import { getAttributeInfoMap } from "../../db/categoryAttribute";

export const getOperator = (type: string, value: FilterValue) => {
  if (value === undefined || value === null) return null;

  switch (type) {
    case DATA_TYPE.NUMBER: {
      const val = value as NumericFilterValue;
      const res: any = {};

      if (val.min !== undefined) res.gte = val.min;
      if (val.max !== undefined) res.lte = val.max;

      if (Array.isArray(val.options) && val.options.length > 0) {
        res.in = val.options.map(Number);
      }

      return Object.keys(res).length > 0 ? res : null;
    }

    case DATA_TYPE.STRING: {
      const val = value as StringFilterValue;
      if (!Array.isArray(val) || val.length === 0) return null;
      return { in: val };
    }

    case DATA_TYPE.BOOLEAN:
      const val = value as BooleanFilterValue;
      return { equals: val };

    default:
      return null;
  }
};

export const getOrderBy = (
  sortBy?: string,
): Prisma.EquipmentOrderByWithRelationInput => {
  if (!sortBy) {
    return { [SYSTEM_FIELDS.NAME]: "asc" };
  }

  const isDesc = sortBy.startsWith("-");
  const field = (
    isDesc ? sortBy.slice(1) : sortBy
  ) as keyof EquipmentSystemFields;

  if (!SYSTEM_FIELD_KEYS.includes(field)) {
    return { [SYSTEM_FIELDS.NAME]: "asc" };
  }

  return { [field]: isDesc ? "desc" : "asc" };
};

export const collectEquipmentAndAttributes = (data: {
  categoryId: string;
  sourceId: string;
  normalizedData: NormalizedData[];
}) => {
  const { categoryId, sourceId, normalizedData } = data;
  const equipmentId = uuidv4();

  const equipmentEntry: Prisma.EquipmentCreateManyInput = {
    id: equipmentId,
    categoryId: categoryId,
    sourceId: sourceId,
    name: null,
    article: null,
    model: null,
    externalCode: null,
    manufacturer: null,
    price: new Prisma.Decimal(0),
  };

  const entryAttributes: Prisma.EquipmentAttributeValueCreateManyInput[] = [];

  normalizedData.forEach((item) => {
    const { target, normalized } = item;

    if (target.type === TARGET_TYPE.SYSTEM) {
      const field = target.field;

      // TODO: в идеале сделать обработку по типу атрибута, а не по самому атрибуту
      if (field === SYSTEM_FIELDS.PRICE) {
        equipmentEntry.price = new Prisma.Decimal(normalized.valueString ?? 0);
      } else {
        // и добавить обработку булевых значений
        equipmentEntry[field] = normalized.valueString;
      }
    } else {
      entryAttributes.push({
        equipmentId: equipmentId,
        attributeId: target.id,
        valueString: normalized.valueString,
        valueMin: normalized.valueMin
          ? new Prisma.Decimal(normalized.valueMin)
          : null,
        valueMax: normalized.valueMax
          ? new Prisma.Decimal(normalized.valueMax)
          : null,
        valueArray: normalized.valueArray
          ? (normalized.valueArray as any)
          : null,
        valueBoolean: normalized.valueBoolean ?? null,
      });
    }
  });

  return {
    equipmentEntry,
    entryAttributes,
  };
};

export const updateCacheFromNormalizedData = async (
  normalizedData: NormalizedData[],
  tx?: Prisma.TransactionClient,
) => {
  const db = tx || prisma;
  const cacheEntriesToSave: any[] = [];

  const attributeInfoMap = await getAttributeInfoMap(
    normalizedData.map((d) => d.target),
  );

  for (const d of normalizedData) {
    if (d.target.type !== TARGET_TYPE.ATTRIBUTE) continue;

    const attrInfo = attributeInfoMap.get(d.target.id);
    let attrType = attrInfo?.dataType;

    if (!attrType) {
      console.log(
        `[LOG]: Attribute type for value ${d.rawValue} not found. Set attribute type to ${DATA_TYPE.STRING}`,
      );
      attrType = DATA_TYPE.STRING;
    }

    const cacheableParts = getCacheableCleanedValues(d.rawValue, attrType);

    if (cacheableParts.length === 1) {
      // Простой кейс (1 к 1): либо строка/булево, либо одиночное число (например, "10 бар")
      cacheEntriesToSave.push({
        attributeId: d.target.id!,
        rawValue: d.rawValue,
        cleanedValue: cacheableParts[0],
        normalized: d.normalized as any,
      });
    } else if (cacheableParts.length > 1) {
      // Сложный кейс: rawValue = '1.25"x2"', cacheableParts = ['1.25"', '2"']
      // Нельзя записать это в кэш, так как d.normalized (например, { valueMin: 1.25, valueMax: 2 })
      // относится ко всей строке rawValue, а не к отдельным частям
      //
      // Поэтому просто игнорируем кэширование этой строки
      // Пользователь ввел данные для оборудования - они сохранились
      // Импорт оборудования по одной единице не такая частая операция, по сравнению с импортом каталогов
      console.log(`[LOG]: Missing caching of composite value: ${d.rawValue}`);
      continue;
    }
  }

  if (cacheEntriesToSave.length > 0) {
    await db.normalizationCache.createMany({
      data: cacheEntriesToSave,
      skipDuplicates: true,
    });
  }
};
