import { FIELD_MAP } from "./config";
import {
  collectEquipmentAndAttributes,
  getOperator,
  getOrderBy,
  updateCacheFromNormalizedData,
} from "./helpers";
import { FilterValue, NumericFilterValue } from "./types";
import { prisma } from "../../prisma";
import { Prisma } from "../../generated/prisma/client";
import { NormalizedData, TransformedRow } from "../NormalizationService/types";
import { DATA_TYPE, IMPORT_SESSION_STATUS, TARGET_TYPE } from "../../config";
import { recalculateFilters } from "../CategoryService/recalculateFilters";

const LIMIT = 20;

export const createEquipmentFromStaging = async (sessionId: string) => {
  const session = await prisma.importSession.findUnique({
    where: { id: sessionId },
    select: { categoryId: true, sourceId: true },
  });

  if (!session) throw new Error("Session not found");

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
      categoryId: session.categoryId,
      sourceId: session.sourceId,
      normalizedData: Object.values(transformedRow).flat(),
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
      data: { status: IMPORT_SESSION_STATUS.COMPLETED },
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
    select: { sourceId: true, categoryId: true },
  });

  if (!session) throw new Error("Session not found");

  const { equipmentEntry, entryAttributes } = collectEquipmentAndAttributes({
    categoryId: session.categoryId,
    sourceId: session.sourceId,
    normalizedData: normalizedData,
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
      data: { status: IMPORT_SESSION_STATUS.COMPLETED },
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
  page?: number;
  limit?: number;
  sortBy?: string;
  filters?: Record<string, FilterValue>;
}) => {
  const { categoryId, page = 1, limit = LIMIT, sortBy, filters } = data;

  const categoryFilters = await prisma.categoryFilter.findMany({
    where: { categoryId },
  });

  const andConditions: Prisma.EquipmentWhereInput[] = [{ categoryId }];

  for (const filter of categoryFilters) {
    if (!filters) break;

    const key = filter.systemField || `attr_${filter.attributeId}`;
    const value = filters[key];
    const operator = getOperator(filter.type, value);

    if (!operator) continue;

    if (filter.systemField) {
      andConditions.push({ [filter.systemField]: operator });
    } else if (filter.attributeId) {
      if (filter.type === DATA_TYPE.NUMBER) {
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

  const headers = [
    ...categoryFilters.map((f) => ({
      key: f.systemField || `attr_${f.attributeId}`,
      label: f.label,
      type: f.systemField ? TARGET_TYPE.SYSTEM : TARGET_TYPE.ATTRIBUTE,
    })),
  ];

  const rows = equipment.map((item) => {
    const row: any = { id: item.id };

    categoryFilters
      .filter((f) => f.systemField)
      .forEach((f) => {
        row[f.systemField!] = (item as any)[f.systemField!];
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
