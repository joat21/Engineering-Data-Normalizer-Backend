import { prisma } from "../../../prisma/prisma";

export const getCategories = async () => await prisma.category.findMany();

export const getCategoryFilters = async (categoryId: string) => {
  const categoryFilters = await prisma.categoryFilter.findMany({
    where: { categoryId },
  });

  return categoryFilters.map((filter) => ({
    key: filter.systemField || `attr_${filter.attributeId}`,
    label: filter.label,
    type: filter.type,
    min: filter.minValue,
    max: filter.maxValue,
    options: filter.options,
  }));
};
