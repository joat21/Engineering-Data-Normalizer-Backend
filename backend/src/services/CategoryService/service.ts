import { prisma } from "../../prisma";
import { DATA_TYPE, SYSTEM_FIELDS_CONFIG } from "../../config";
import { getAttributeOptionsMap } from "../../helpers/getAttributeOptionsMap";
import { booleanNormalizationOptions } from "../NormalizationService/config";

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

export const getCategoryAttributes = async (categoryId: string) => {
  const categoryAttributes = await prisma.categoryAttribute.findMany({
    where: { categoryId },
  });

  const stringAttrIds = categoryAttributes
    .filter((attr) => attr.dataType === DATA_TYPE.STRING)
    .map((attr) => attr.id);

  const optionsMap = await getAttributeOptionsMap(stringAttrIds);

  const systemFields = Object.entries(SYSTEM_FIELDS_CONFIG).map(
    ([key, config]) => ({
      id: key,
      key: key,
      label: config.label,
      unit: null,
      dataType: config.type,
      isFilterable: true,
      options: [],
    }),
  );

  const attributes = categoryAttributes.map((attr) => {
    const { categoryId, ...rest } = attr;
    let options = optionsMap.get(attr.id) || [];

    // Подмешиваем дефолтные булевы значения
    if (attr.dataType === DATA_TYPE.BOOLEAN && options.length === 0) {
      options = booleanNormalizationOptions;
    }

    return {
      ...rest,
      options,
    };
  });

  return [...systemFields, ...attributes];
};
