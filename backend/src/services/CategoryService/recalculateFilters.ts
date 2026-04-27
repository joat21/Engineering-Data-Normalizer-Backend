import pMap from "p-map";
import {
  DataType,
  FieldContext,
  getSystemFields,
} from "@engineering-data-normalizer/shared";
import { EquipmentSystemFields } from "../../types";
import { Prisma } from "../../generated/prisma/client";
import { prisma } from "../../prisma";
import { ApiError } from "../../exceptions/api-error";

export const recalculateFilters = async (categoryId: string) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: { attributes: { where: { isFilterable: true } } },
  });

  if (!category) throw ApiError.NotFound("Категория не найдена");

  // Системных полей мало, поэтому все запросы через Promise.all
  const systemFieldFilters = await Promise.all(
    Object.entries(getSystemFields(FieldContext.FILTERS)).map(
      async ([field, config]) => {
        const systemField = field as keyof EquipmentSystemFields;
        const baseFilter = {
          categoryId,
          systemField,
          label: config.label,
          unit: config.unit,
        };

        if (config.type === DataType.NUMBER) {
          const agg = await prisma.equipment.aggregate({
            where: { categoryId },
            _min: { [systemField]: true },
            _max: { [systemField]: true },
          });

          return {
            ...baseFilter,
            type: DataType.NUMBER,
            minValue: agg._min[systemField],
            maxValue: agg._max[systemField],
            options: [],
          };
        }

        const groups = await prisma.equipment.findMany({
          where: { categoryId, NOT: { [systemField]: null } },
          distinct: [systemField],
          select: { [systemField]: true },
        });

        return {
          ...baseFilter,
          type: DataType.STRING,
          options: groups.map((g) => g[systemField]).filter((v) => v !== null),
        };
      },
    ),
  );

  // Атрибутов может быть много, поэтому через p-map запросы будут идти в несколько потоков,
  // чтобы не уронить БД и не схлопнуться из за таймаутов
  const attributeFilters = await pMap(
    category.attributes,
    async (attr) => {
      const baseFilter = {
        categoryId,
        attributeId: attr.id,
        label: attr.label,
        type: attr.dataType,
        unit: attr.unit,
      };

      if (attr.dataType === DataType.NUMBER) {
        const [agg, groups] = await Promise.all([
          prisma.equipmentAttributeValue.aggregate({
            where: { attributeId: attr.id },
            _min: { valueMin: true },
            _max: { valueMax: true },
          }),
          prisma.equipmentAttributeValue.findMany({
            where: { attributeId: attr.id },
            distinct: ["valueString"],
            select: { valueString: true },
          }),
        ]);

        return {
          ...baseFilter,
          minValue: agg._min.valueMin,
          maxValue: agg._max.valueMax,
          options: groups.map((g) => g.valueString),
        };
      }

      if (attr.dataType === DataType.STRING) {
        const groups = await prisma.equipmentAttributeValue.findMany({
          where: { attributeId: attr.id },
          distinct: ["valueString"],
          select: { valueString: true },
        });

        return {
          ...baseFilter,
          options: groups.map((g) => g.valueString),
        };
      }

      return baseFilter;
    },
    { concurrency: 5 },
  );

  const filterEntries: Prisma.CategoryFilterCreateManyInput[] = [
    ...systemFieldFilters,
    ...attributeFilters,
  ];

  await prisma.$transaction([
    prisma.categoryFilter.deleteMany({ where: { categoryId } }),
    prisma.categoryFilter.createMany({ data: filterEntries }),
  ]);
};

export const recalculateAllCategoryFilters = async () => {
  console.log(
    `[${new Date().toISOString()}] [LOG]: Starting global filters recalculation`,
  );
  const startTime = Date.now();

  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
    });

    console.log(`[LOG]: Found ${categories.length} categories to process`);

    for (const category of categories) {
      const catStartTime = Date.now();
      try {
        await recalculateFilters(category.id);
        console.log(
          `[LOG]: Filters for "${category.name}" updated in ${Date.now() - catStartTime}ms`,
        );
      } catch (err) {
        console.error(
          `[Error]: Failed to recalculate filters for category ${category.name}:`,
          err,
        );
      }
    }

    const duration = Date.now() - startTime;
    console.log(
      `[${new Date().toISOString()}] [LOG]: Global filters recalculation finished in ${duration}ms`,
    );
  } catch (error) {
    console.error(
      `[Error]: Critical failure in recalculateAllCategoryFilters:`,
      error,
    );
  }
};
