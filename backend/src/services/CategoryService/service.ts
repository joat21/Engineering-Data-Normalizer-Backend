import slugify from "slugify";
import {
  CreateCategoryAttributeBody,
  CreateCategoryAttributeParams,
  CreateCategoryBody,
  DataType,
  FieldContext,
  getSystemFields,
  MappingTargetType,
  UpdateCategoryAttributeBody,
  UpdateCategoryAttributeParams,
} from "@engineering-data-normalizer/shared";
import { prisma } from "../../prisma";
import { getAttributeOptionsMap } from "../../helpers/getAttributeOptionsMap";
import { booleanNormalizationOptions } from "../NormalizationService/config";
import { handleUpdateCategoryFilter } from "./handleUpdateCategoryFilter";
import { ApiError } from "../../exceptions/api-error";
import {
  checkIsLabelExist,
  transformSystemFieldsToAttributes,
} from "./helpers";

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

  const stringAttrIds = categoryAttributes
    .filter((attr) => attr.dataType === DataType.STRING)
    .map((attr) => attr.id);

  const optionsMap = await getAttributeOptionsMap(stringAttrIds);

  const systemFields = transformSystemFieldsToAttributes(
    getSystemFields(FieldContext.IMPORT),
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
    throw ApiError.NotFound("Категория не найдена");
  }

  const systemFields = transformSystemFieldsToAttributes(getSystemFields());

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

  const isLabelExist = await checkIsLabelExist(categoryId, label);
  if (isLabelExist) {
    throw ApiError.BadRequest(
      `Атрибут с названием "${label}" уже добавлен в эту категорию`,
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
  const { id, label } = data;

  const existingAttribute = await prisma.categoryAttribute.findUnique({
    where: { id },
  });

  if (!existingAttribute) {
    throw ApiError.NotFound("Атрибут не найден");
  }

  const isLabelExist = await checkIsLabelExist(
    existingAttribute?.categoryId,
    label ?? "",
  );

  if (isLabelExist) {
    throw ApiError.BadRequest(
      `Атрибут с названием "${label}" уже добавлен в эту категорию`,
    );
  }

  const updatedAttribute = await prisma.categoryAttribute.update({
    where: { id: data.id },
    data: data,
  });

  await handleUpdateCategoryFilter(
    updatedAttribute.categoryId,
    updatedAttribute,
    {
      labelChanged: label !== existingAttribute.label,
      isFilterable: updatedAttribute.isFilterable,
    },
  );

  return updatedAttribute;
};
