import {
  DataType,
  EquipmentHeader,
  EquipmentRow,
  EquipmentTableResponse,
  FilterValue,
  getSystemFields,
  MappingTargetType,
  NormalizedData,
  NumericFilterValue,
} from "@engineering-data-normalizer/shared";
import { FIELD_MAP } from "./config";
import {
  collectEquipmentAndAttributes,
  getOperator,
  getOrderBy,
  updateCacheFromNormalizedData,
} from "./helpers";
import { prisma } from "../../prisma";
import { Prisma } from "../../generated/prisma/client";
import { TransformedRow } from "../NormalizationService/types";
import { recalculateFilters } from "../CategoryService/recalculateFilters";
import { EquipmentSystemFields, ImportSessionStatus } from "../../types";
import { ApiError } from "../../exceptions/api-error";
import { SYSTEM_FIELDS } from "../../config";

const LIMIT = 20;

export const createEquipmentFromStaging = async (sessionId: string) => {
  const session = await prisma.importSession.findUnique({
    where: { id: sessionId },
    select: {
      categoryId: true,
      sourceId: true,
      manufacturer: true,
      supplier: true,
      currency: true,
    },
  });

  if (!session) {
    throw ApiError.NotFound("Сессия импорта не найдена");
  }

  const { categoryId, sourceId, manufacturer, supplier, currency } = session;

  // TODO: есть похожая функция в db/categoryAttributes
  // в идеале ее переиспользовать
  const categoryAttributes = await prisma.categoryAttribute.findMany({
    where: { categoryId: session.categoryId },
    select: { id: true, dataType: true, unit: true, label: true },
  });

  const attributeInfoMap = new Map(
    categoryAttributes.map((a) => [
      a.id,
      { dataType: a.dataType, unit: a.unit, label: a.label },
    ]),
  );

  const items = await prisma.stagingImportItem.findMany({
    where: { sessionId },
    select: { transformedRow: true },
  });

  const equipmentToCreate: Prisma.EquipmentCreateManyInput[] = [];
  const attributesToCreate: Prisma.EquipmentAttributeValueCreateManyInput[] =
    [];

  items.forEach((item) => {
    const transformedRow = item.transformedRow as unknown as TransformedRow;
    if (!transformedRow) return;

    const { equipmentEntry, entryAttributes } = collectEquipmentAndAttributes({
      categoryId,
      sourceId,
      manufacturer,
      supplier,
      currency,
      normalizedData: Object.values(transformedRow).flat(),
      attributeInfoMap,
    });

    equipmentToCreate.push(equipmentEntry);
    attributesToCreate.push(...entryAttributes);
  });

  const result = await prisma.$transaction(async (tx) => {
    if (equipmentToCreate.length > 0) {
      await tx.equipment.createMany({
        data: equipmentToCreate,
      });
    }

    if (attributesToCreate.length > 0) {
      await tx.equipmentAttributeValue.createMany({
        data: attributesToCreate,
      });
    }

    await tx.importSession.update({
      where: { id: sessionId },
      data: { status: ImportSessionStatus.COMPLETED },
    });

    return {
      equipmentCount: equipmentToCreate.length,
      attributesCount: attributesToCreate.length,
    };
  });

  recalculateFilters(session.categoryId).catch(console.error);
  prisma.stagingImportItem
    .deleteMany({ where: { sessionId } })
    .catch(console.error);

  return result;
};

export const createEquipment = async (data: {
  sessionId: string;
  normalizedData: NormalizedData[];
}) => {
  const { sessionId, normalizedData } = data;

  const session = await prisma.importSession.findUnique({
    where: { id: sessionId },
    select: {
      categoryId: true,
      sourceId: true,
      manufacturer: true,
      supplier: true,
      currency: true,
    },
  });

  if (!session) {
    throw ApiError.NotFound("Сессия импорта не найдена");
  }

  const { categoryId, sourceId, manufacturer, supplier, currency } = session;

  const categoryAttributes = await prisma.categoryAttribute.findMany({
    where: { categoryId: session.categoryId },
    select: { id: true, dataType: true, unit: true, label: true },
  });

  const attributeInfoMap = new Map(
    categoryAttributes.map((a) => [
      a.id,
      { dataType: a.dataType, unit: a.unit, label: a.label },
    ]),
  );

  const { equipmentEntry, entryAttributes } = collectEquipmentAndAttributes({
    categoryId,
    sourceId,
    manufacturer,
    supplier,
    currency,
    normalizedData: normalizedData,
    attributeInfoMap,
  });

  const created = await prisma.$transaction(async (tx) => {
    await tx.equipment.create({ data: equipmentEntry });

    if (entryAttributes.length > 0) {
      await tx.equipmentAttributeValue.createMany({
        data: entryAttributes,
      });
    }

    await updateCacheFromNormalizedData(normalizedData, tx);

    await tx.importSession.update({
      where: { id: sessionId },
      data: { status: ImportSessionStatus.COMPLETED },
    });

    return {
      equipmentCount: 1,
      attributesCount: entryAttributes.length,
    };
  });

  recalculateFilters(session.categoryId).catch(console.error);

  return created;
};

export const getEquipmentTable = async (data: {
  categoryId: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  filters?: Record<string, FilterValue>;
}): Promise<EquipmentTableResponse> => {
  const { categoryId, search, page = 1, limit = LIMIT, sortBy, filters } = data;

  const categoryFilters = await prisma.categoryFilter.findMany({
    where: { categoryId },
  });

  const andConditions: Prisma.EquipmentWhereInput[] = [{ categoryId }];

  if (search) {
    // получаем id через сырой SQL, чтобы задействовать GIN индекс
    const searchedIds: { id: string }[] = await prisma.$queryRaw`
      SELECT id FROM "Equipment"
      WHERE "search_vector" @@ plainto_tsquery('russian', ${search})
      AND "categoryId" = ${categoryId}
    `;

    const ids = searchedIds.map((s) => s.id);

    // если ничего не нашли по поиску - возвращаем пустой результат сразу
    if (ids.length === 0) {
      return {
        headers: [],
        rows: [],
        pagination: { total: 0, page, limit, totalPages: 0 },
      };
    }

    andConditions.push({ id: { in: ids } });
  }

  for (const filter of categoryFilters) {
    if (!filters) break;

    const key = filter.systemField || `attr_${filter.attributeId}`;
    const value = filters[key];
    const operator = getOperator(filter.type, value);

    if (!operator) continue;

    if (filter.systemField) {
      andConditions.push({ [filter.systemField]: operator });
    } else if (filter.attributeId) {
      if (filter.type === DataType.NUMBER) {
        const val = value as NumericFilterValue;
        const attrMatch: any = { attributeId: filter.attributeId };

        if (val.min !== undefined || val.max !== undefined) {
          if (val.max !== undefined) attrMatch.valueMin = { lte: val.max };
          if (val.min !== undefined) attrMatch.valueMax = { gte: val.min };
        }

        if (val.options && val.options.length > 0) {
          attrMatch.valueString = { in: val.options };
        }

        andConditions.push({ attributes: { some: attrMatch } });
      } else {
        const fieldName = FIELD_MAP[filter.type];

        andConditions.push({
          attributes: {
            some: {
              attributeId: filter.attributeId,
              [fieldName]: operator,
            },
          },
        });
      }
    }
  }

  const [total, equipment] = await Promise.all([
    prisma.equipment.count({ where: { AND: andConditions } }),
    prisma.equipment.findMany({
      where: { AND: andConditions },
      take: limit,
      skip: (page - 1) * limit,
      orderBy: getOrderBy(sortBy),
      include: { attributes: true },
    }),
  ]);

  const headers: EquipmentHeader[] = [
    ...categoryFilters.map((f) => ({
      key: f.systemField || `attr_${f.attributeId}`,
      label: f.label,
      unit: f.unit,
      type: f.systemField
        ? MappingTargetType.SYSTEM
        : MappingTargetType.ATTRIBUTE,
    })),
  ];

  const rows = equipment.map((item, i) => {
    const row: EquipmentRow = { id: item.id };

    categoryFilters
      .filter((f) => f.systemField)
      .forEach((f) => {
        const value = (item as any)[f.systemField!];
        row[f.systemField!] = value;
      });

    const valuesMap = new Map(item.attributes.map((a) => [a.attributeId, a]));
    categoryFilters
      .filter((f) => f.attributeId)
      .forEach((f) => {
        const val = valuesMap.get(f.attributeId!);
        row[`attr_${f.attributeId}`] = val ? val.valueString : null;
      });

    return row;
  });

  return {
    headers,
    rows,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getEquipmentDetails = async (id: string) => {
  const item = await prisma.equipment.findUnique({
    where: { id },
    include: {
      source: true,
      attributes: {
        include: {
          attribute: true,
        },
      },
    },
  });

  if (!item) {
    throw ApiError.NotFound("Оборудование не найдено");
  }

  const systemFields = Object.entries(getSystemFields()).map(
    ([key, config]) => {
      const systemField = key as keyof EquipmentSystemFields;
      const value = item[systemField] ? String(item[systemField]) : null;

      return {
        label: config.label,
        value,
        unit: config.unit,
      };
    },
  );

  const attributes = item.attributes.map((attrVal) => {
    const { attribute, valueString } = attrVal;

    return {
      label: attribute.label,
      value: valueString,
      unit: attribute.unit,
    };
  });

  return {
    id: item.id,
    name: item.name,
    source: {
      fileName: item.source.fileName,
      url: item.source.url,
      uploadedAt: item.source.uploadedAt,
    },
    systemFields,
    attributes,
  };
};
