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
  getExistingAttributeLabel,
  transformSystemFieldsToAttributes,
} from "./helpers";
import { SYSTEM_FIELDS } from "../../config";

export const getCategories = async () => await prisma.category.findMany();

export const getCategoryFilters = async (categoryId: string) => {
  const categoryFilters = await prisma.categoryFilter.findMany({
    where: { categoryId },
  });

  return categoryFilters.map((filter) => ({
    key: filter.systemField || `attr_${filter.attributeId}`,
    label: filter.label,
    unit: filter.unit,
    type: filter.type,
    min: filter.minValue,
    max: filter.maxValue,
    options: filter.options,
  }));
};

export const getAttributesForImport = async (importSessionId: string) => {
  const session = await prisma.importSession.findUnique({
    where: { id: importSessionId },
    select: { categoryId: true, currency: true },
  });

  if (!session) {
    throw ApiError.NotFound("Сессия импорта не найдена");
  }

  const { categoryId, currency } = session;

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
  ).map((field) => ({
    ...field,
    unit: field.key === SYSTEM_FIELDS.PRICE ? currency?.symbol : field.unit,
  }));

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
  const { name } = data;

  const existingCategory = await prisma.category.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });

  if (existingCategory) {
    throw ApiError.BadRequest(
      `Категория с названием "${existingCategory.name}" уже существует`,
    );
  }

  return prisma.category.create({
    data,
  });
};

export const createCategoryAttribute = async (
  data: CreateCategoryAttributeParams & CreateCategoryAttributeBody,
) => {
  const { id: categoryId, isFilterable, label, unit, dataType } = data;

  const existingLabel = await getExistingAttributeLabel(categoryId, label);
  if (existingLabel) {
    throw ApiError.BadRequest(
      `Атрибут с названием "${existingLabel}" уже добавлен в эту категорию`,
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

  const existingLabel = await getExistingAttributeLabel(
    existingAttribute?.categoryId,
    label ?? "",
  );

  if (existingLabel) {
    throw ApiError.BadRequest(
      `Атрибут с названием "${existingLabel}" уже добавлен в эту категорию`,
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

export const getCategoriesCount = async () => {
  return prisma.category.count();
};

export const getTopCategories = async () => {
  const topCategories = await prisma.equipment.groupBy({
    by: ["categoryId"],
    _count: {
      id: true,
    },
    orderBy: {
      _count: {
        id: "desc",
      },
    },
    take: 5,
  });

  const ids = topCategories.map((c) => c.categoryId);

  const categories = await prisma.category.findMany({
    where: { id: { in: ids } },
  });

  const categoryNameMap = new Map(categories.map((c) => [c.id, c.name]));

  return topCategories.map((item) => ({
    id: item.categoryId,
    name: categoryNameMap.get(item.categoryId) || "Без категории",
    count: item._count.id,
  }));
};
