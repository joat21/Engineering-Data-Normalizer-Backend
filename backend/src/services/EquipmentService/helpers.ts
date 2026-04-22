import { v4 as uuidv4 } from "uuid";
import {
  BooleanFilterValue,
  DataType,
  FilterValue,
  MappingTargetType,
  NormalizedData,
  NumericFilterValue,
  StringFilterValue,
  SYSTEM_FIELD_KEYS,
  SYSTEM_FIELDS_CONFIG,
} from "@engineering-data-normalizer/shared";
import { prisma } from "../../prisma";
import { SYSTEM_FIELDS } from "../../config";
import { Prisma } from "../../generated/prisma/client";
import {
  Currency,
  EquipmentSystemFields,
  Manufacturer,
  Supplier,
} from "../../types";
import { getCacheableCleanedValues } from "../../helpers/cache";
import { getAttributeInfoMap } from "../../db/categoryAttribute";

export const getOperator = (type: string, value: FilterValue) => {
  if (value === undefined || value === null) return null;

  switch (type) {
    case DataType.NUMBER: {
      const val = value as NumericFilterValue;
      const res: any = {};

      if (val.min !== undefined) res.gte = val.min;
      if (val.max !== undefined) res.lte = val.max;

      if (Array.isArray(val.options) && val.options.length > 0) {
        res.in = val.options.map(Number);
      }

      return Object.keys(res).length > 0 ? res : null;
    }

    case DataType.STRING: {
      const val = value as StringFilterValue;
      if (!Array.isArray(val) || val.length === 0) return null;
      return { in: val };
    }

    case DataType.BOOLEAN:
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
  manufacturer: Manufacturer | null;
  supplier: Supplier | null;
  currency: Currency | null;
  normalizedData: NormalizedData[];
  attributeInfoMap: Map<
    string,
    { dataType: DataType; unit: string; label: string }
  >;
}) => {
  const {
    categoryId,
    sourceId,
    manufacturer,
    supplier,
    currency,
    normalizedData,
    attributeInfoMap,
  } = data;
  const equipmentId = uuidv4();

  const equipmentEntry: Prisma.EquipmentCreateManyInput = {
    id: equipmentId,
    categoryId,
    sourceId,
    searchText: "",
    name: null,
    article: null,
    model: null,
    externalCode: null,
    manufacturerId: manufacturer?.id || null,
    manufacturerName: manufacturer?.name || null,
    supplierName: supplier?.name || null,
    supplierId: supplier?.id || null,
    currencyId: currency?.id,
    price: 0,
    priceInRub: 0,
  };

  const entryAttributes: Prisma.EquipmentAttributeValueCreateManyInput[] = [];

  normalizedData.forEach((item) => {
    const { target, normalized } = item;

    if (target.type === MappingTargetType.SYSTEM) {
      const field = target.field;

      // TODO: в идеале сделать обработку по типу атрибута, а не по самому атрибуту
      if (field === SYSTEM_FIELDS.PRICE) {
        const price = Number(normalized.valueString ?? 0);
        equipmentEntry.price = price;
        equipmentEntry.priceInRub = Number(price) * Number(currency?.rate || 1);
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

  equipmentEntry.searchText = buildSearchText(
    equipmentEntry,
    entryAttributes,
    attributeInfoMap,
  );

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
    if (d.target.type !== MappingTargetType.ATTRIBUTE) continue;

    const attrInfo = attributeInfoMap.get(d.target.id);
    let attrType = attrInfo?.dataType;

    if (!attrType) {
      console.log(
        `[LOG]: Attribute type for value ${d.rawValue} not found. Set attribute type to ${DataType.STRING}`,
      );
      attrType = DataType.STRING;
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

export const buildSearchText = (
  equipmentEntry: Prisma.EquipmentCreateManyInput,
  attributes: Prisma.EquipmentAttributeValueCreateManyInput[],
  attributeInfoMap: Map<
    string,
    { dataType: DataType; unit: string; label: string }
  >,
) => {
  const parts: string[] = [];

  for (const [key, config] of Object.entries(SYSTEM_FIELDS_CONFIG)) {
    const field = key as keyof EquipmentSystemFields;

    if (field === SYSTEM_FIELDS.PRICE) continue;

    if (equipmentEntry[field]) {
      parts.push(config.label);
      parts.push(equipmentEntry[field]);
    }
  }

  attributes.forEach((attr) => {
    const attrInfo = attributeInfoMap.get(attr.attributeId);

    if (attrInfo?.label) {
      parts.push(attrInfo.label);
    }

    parts.push(attr.valueString);

    if (attrInfo?.dataType === DataType.NUMBER && attrInfo.unit) {
      const unit = attrInfo.unit.toLowerCase();

      if (attr.valueMin !== undefined && attr.valueMin !== null) {
        parts.push(`${attr.valueMin}${unit}`);
      }

      if (
        attr.valueMax !== undefined &&
        attr.valueMax !== null &&
        attr.valueMax !== attr.valueMin
      ) {
        parts.push(`${attr.valueMax}${unit}`);
      }
    }
  });

  return parts.join(" ").toLowerCase();
};
