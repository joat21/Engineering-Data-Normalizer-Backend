import { DATA_TYPE, SYSTEM_FIELDS_CONFIG } from "../../config";
import { EquipmentSystemFields } from "../../types";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../../prisma/prisma";

export const recalculateFilters = async (categoryId: string) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { attributes: { where: { isFilterable: true } } },
  });

  if (!category) throw new Error("Category not found");

  const filterEntries: Prisma.CategoryFilterCreateManyInput[] = [];

  for (const [field, config] of Object.entries(SYSTEM_FIELDS_CONFIG)) {
    const systemField = field as keyof EquipmentSystemFields;

    if (field === DATA_TYPE.NUMBER) {
      const [agg, groups] = await Promise.all([
        prisma.equipment.aggregate({
          where: { categoryId },
          _min: { [systemField]: true },
          _max: { [systemField]: true },
        }),
        prisma.equipment.groupBy({
          by: systemField,
          where: { categoryId, NOT: { [systemField]: null } },
        }),
      ]);

      filterEntries.push({
        categoryId,
        systemField,
        label: config.label,
        type: DATA_TYPE.NUMBER,
        minValue: agg._min[systemField],
        maxValue: agg._max[systemField],
        options: groups.map((g) => g[systemField]).filter(Boolean),
      });
    } else {
      const groups = await prisma.equipment.groupBy({
        by: [systemField],
        where: { categoryId, NOT: { [systemField]: null } },
      });

      filterEntries.push({
        categoryId,
        systemField: field,
        label: config.label,
        type: DATA_TYPE.STRING,
        options: groups.map((g) => g[systemField]).filter(Boolean),
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

    if (attr.dataType === DATA_TYPE.NUMBER) {
      const [agg, groups] = await Promise.all([
        prisma.equipmentAttributeValue.aggregate({
          where: { attributeId: attr.id },
          _min: { valueMin: true },
          _max: { valueMax: true },
        }),
        prisma.equipmentAttributeValue.groupBy({
          by: ["valueString"],
          where: { attributeId: attr.id },
        }),
      ]);

      filterEntries.push({
        ...baseFilter,
        minValue: agg._min.valueMin,
        maxValue: agg._max.valueMax,
        options: groups.map((g) => g.valueString),
      });
    } else if (attr.dataType === DATA_TYPE.STRING) {
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
