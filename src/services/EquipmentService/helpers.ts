import { prisma } from "../../../prisma/prisma";
import { Prisma } from "../../generated/prisma/client";
import { SYSTEM_FIELDS_CONFIG } from "./config";
import {
  BooleanFilterValue,
  FilterValue,
  NumericFilterValue,
  StringFilterValue,
} from "./types";

export const recalculateFilters = async (categoryId: string) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { attributes: { where: { isFilterable: true } } },
  });

  if (!category) throw new Error("Category not found");

  const filterEntries: Prisma.CategoryFilterCreateManyInput[] = [];

  for (const [field, config] of Object.entries(SYSTEM_FIELDS_CONFIG)) {
    if (config.type === "NUMBER") {
      const agg = await prisma.equipment.aggregate({
        where: { categoryId },
        _min: { price: true },
        _max: { price: true },
      });

      filterEntries.push({
        categoryId,
        systemField: field,
        label: config.label,
        type: "NUMBER",
        minValue: agg._min.price,
        maxValue: agg._max.price,
      });
    } else {
      const groups = await prisma.equipment.groupBy({
        by: [field as any],
        where: { categoryId, NOT: { [field]: null } },
      });

      filterEntries.push({
        categoryId,
        systemField: field,
        label: config.label,
        type: "STRING",
        options: groups.map((g) => g[field as any]).filter(Boolean),
      });
    }
  }

  for (const attr of category.attributes) {
    const baseFilter = {
      categoryId,
      attributeId: attr.id,
      label: attr.label,
      type: attr.dataType,
    };

    if (attr.dataType === "NUMBER") {
      const agg = await prisma.equipmentAttributeValue.aggregate({
        where: { attributeId: attr.id },
        _min: { valueMin: true },
        _max: { valueMax: true },
      });

      const groups = await prisma.equipmentAttributeValue.groupBy({
        by: ["valueString"],
        where: { attributeId: attr.id },
      });

      filterEntries.push({
        ...baseFilter,
        minValue: agg._min.valueMin,
        maxValue: agg._max.valueMax,
        options: groups.map((g) => g.valueString),
      });
    } else if (attr.dataType === "STRING") {
      const groups = await prisma.equipmentAttributeValue.groupBy({
        by: ["valueString"],
        where: { attributeId: attr.id },
      });

      filterEntries.push({
        ...baseFilter,
        options: groups.map((g) => g.valueString),
      });
    } else {
      filterEntries.push(baseFilter);
    }
  }

  await prisma.$transaction([
    prisma.categoryFilter.deleteMany({ where: { categoryId } }),
    prisma.categoryFilter.createMany({ data: filterEntries }),
  ]);
};

export const getOperator = (type: string, value: FilterValue) => {
  if (value === undefined || value === null) return null;

  switch (type) {
    case "NUMBER": {
      const val = value as NumericFilterValue;
      const res: any = {};

      if (val.min !== undefined) res.gte = val.min;
      if (val.max !== undefined) res.lte = val.max;

      if (Array.isArray(val.options) && val.options.length > 0) {
        res.in = val.options.map(Number);
      }

      return Object.keys(res).length > 0 ? res : null;
    }

    case "STRING": {
      const val = value as StringFilterValue;
      if (!Array.isArray(val) || val.length === 0) return null;
      return { in: val };
    }

    case "BOOLEAN":
      const val = value as BooleanFilterValue;
      return { equals: val };

    default:
      return null;
  }
};
