import {
  CreateCategoryAttributeBody,
  CreateCategoryAttributeParams,
  CreateCategoryBody,
  DataType,
  MappingTargetType,
  NormalizationOption,
  SYSTEM_FIELDS_CONFIG,
  UpdateCategoryAttributeBody,
  UpdateCategoryAttributeParams,
} from "@engineering-data-normalizer/shared";
import { prisma } from "../../prisma";
import { getAttributeOptionsMap } from "../../helpers/getAttributeOptionsMap";
import { booleanNormalizationOptions } from "../NormalizationService/config";
import slugify from "slugify";
import { handleUpdateCategoryFilter } from "./handleUpdateCategoryFilter";

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
    orderBy: { label: "asc" },
  });

  const [manufacturers, suppliers] = await Promise.all([
    prisma.manufacturer.findMany({
      orderBy: { name: "asc" },
    }),
    prisma.supplier.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  const stringAttrIds = categoryAttributes
    .filter((attr) => attr.dataType === DataType.STRING)
    .map((attr) => attr.id);

  const optionsMap = await getAttributeOptionsMap(stringAttrIds);

  const systemFields = Object.entries(SYSTEM_FIELDS_CONFIG).map(
    ([key, config]) => {
      let options: NormalizationOption[] = [];

      // костыльный костыль, таску на исправление себе уже записал
      if (key === "manufacturerName")
        options = manufacturers.map((m) => ({
          id: m.id,
          label: m.name,
          normalized: { valueString: m.name },
        }));
      if (key === "supplierName")
        options = suppliers.map((s) => ({
          id: s.id,
          label: s.name,
          normalized: { valueString: s.name },
        }));

      return {
        id: key,
        key: key,
        type: MappingTargetType.SYSTEM,
        label: config.label,
        unit: null,
        dataType: config.type,
        isFilterable: true,
        options,
      };
    },
  );

  const attributes = categoryAttributes.map((attr) => {
    const { categoryId, ...rest } = attr;
    let options = optionsMap.get(attr.id) || [];

    // Подмешиваем дефолтные булевы значения
    if (attr.dataType === DataType.BOOLEAN && options.length === 0) {
      options = booleanNormalizationOptions;
    }

    return {
      ...rest,
      type: MappingTargetType.ATTRIBUTE,
      options,
    };
  });

  return [...systemFields, ...attributes];
};

export const getCategoryWithAttributes = async (categoryId: string) => {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      attributes: {
        orderBy: { label: "asc" },
      },
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  const systemFields = Object.entries(SYSTEM_FIELDS_CONFIG).map(
    ([key, config]) => ({
      id: key,
      key: key,
      type: MappingTargetType.SYSTEM,
      label: config.label,
      unit: null,
      dataType: config.type,
      isFilterable: true,
      options: [],
    }),
  );

  // здесь мне не нужны options, поэтому пустой массив
  const attributes = category.attributes.map((attr) => ({
    ...attr,
    type: MappingTargetType.ATTRIBUTE,
    options: [],
  }));

  return { ...category, attributes: [...systemFields, ...attributes] };
};

export const createCategory = async (data: CreateCategoryBody) => {
  return prisma.category.create({
    data: {
      name: data.name,
    },
  });
};

export const createCategoryAttribute = async (
  data: CreateCategoryAttributeParams & CreateCategoryAttributeBody,
) => {
  const { id: categoryId, isFilterable, label, unit, dataType } = data;

  const existingLabel = await prisma.categoryAttribute.findFirst({
    where: {
      categoryId,
      label,
    },
  });

  if (existingLabel) {
    throw new Error(
      `Атрибут с названием "${label}" уже существует в этой категории`,
    );
  }

  const baseKey = slugify(label, {
    replacement: "_",
    lower: true,
    strict: true,
  });

  // Программное решение коллизий для кейсов вида
  // "Мощность (макс)" = moshchnost_maks и "Мощность макс" = moshchnost_maks
  // возможно не самый лучший вариант, но по идее вполне рабочий
  let finalKey = baseKey;
  let counter = 1;

  while (true) {
    const existingKey = await prisma.categoryAttribute.findFirst({
      where: {
        categoryId,
        key: finalKey,
      },
    });

    if (!existingKey) {
      break;
    }

    finalKey = `${baseKey}_${counter}`;
    counter++;
  }

  return prisma.categoryAttribute.create({
    data: {
      categoryId,
      key: finalKey,
      label,
      unit: unit ?? "",
      dataType,
      isFilterable,
    },
  });
};

export const updateCategoryAttribute = async (
  data: UpdateCategoryAttributeParams & UpdateCategoryAttributeBody,
) => {
  const attribute = await prisma.categoryAttribute.update({
    where: { id: data.id },
    data: data,
  });

  await handleUpdateCategoryFilter(attribute.categoryId, attribute, {
    labelChanged: !!data.label,
    isFilterable: attribute.isFilterable,
  });

  return attribute;
};
