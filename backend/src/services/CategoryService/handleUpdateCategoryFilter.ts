import { DataType } from "@engineering-data-normalizer/shared";
import { prisma } from "../../prisma";
import { Prisma } from "../../generated/prisma/client";

export const handleUpdateCategoryFilter = async (
  categoryId: string,
  attribute: Prisma.CategoryAttributeModel,
  changes: {
    labelChanged: boolean;
    isFilterable: boolean;
  },
) => {
  // Если атрибут СТАЛ НЕфильтруемым - удалям из таблицы фильтров и выходим
  if (!changes.isFilterable) {
    await prisma.categoryFilter.deleteMany({
      where: { categoryId, attributeId: attribute.id },
    });
    return;
  }

  // Если поменялся label - пытаемся обновить существующий фильтр
  if (changes.labelChanged) {
    const updateResult = await prisma.categoryFilter.updateMany({
      where: { categoryId, attributeId: attribute.id },
      data: { label: attribute.label },
    });

    // Если в CategoryFilter БЫЛ нужный фильтр, то он обновится и count будет больше 0
    // выходим
    if (updateResult.count > 0) {
      return;
    }
  }

  // Если дошли до сюда, значит либо:
  //  - атрибут только что СТАЛ фильтруемым (на предыдущем шаге в БД для него не нашлось фильтра)
  //  - либо какой то косяк произошел и фильтра нет в таблице, хотя у атрибута isFilterable: true
  // Считаем фильтр только для этого атрибута

  // Проверяем, нет ли его уже (на всякий случай, чтобы не поймать Unique Constraint Error)
  const existingFilter = await prisma.categoryFilter.findUnique({
    where: {
      categoryId_attributeId: { categoryId, attributeId: attribute.id },
    },
  });

  if (existingFilter) return;

  // TODO: кусок из recalculateFilters, надо будет вынести
  const baseFilter: Prisma.CategoryFilterCreateInput = {
    category: { connect: { id: categoryId } },
    attribute: { connect: { id: attribute.id } },
    label: attribute.label,
    type: attribute.dataType,
    unit: attribute.unit,
  };

  if (attribute.dataType === DataType.NUMBER) {
    const [agg, groups] = await Promise.all([
      prisma.equipmentAttributeValue.aggregate({
        where: { attributeId: attribute.id },
        _min: { valueMin: true },
        _max: { valueMax: true },
      }),
      prisma.equipmentAttributeValue.findMany({
        where: { attributeId: attribute.id },
        distinct: ["valueString"],
        select: { valueString: true },
      }),
    ]);

    baseFilter.minValue = agg._min.valueMin;
    baseFilter.maxValue = agg._max.valueMax;
    baseFilter.options = groups.map((g) => g.valueString);
  } else if (attribute.dataType === DataType.STRING) {
    const groups = await prisma.equipmentAttributeValue.findMany({
      where: { attributeId: attribute.id },
      distinct: ["valueString"],
      select: { valueString: true },
    });

    baseFilter.options = groups.map((g) => g.valueString);
  }

  await prisma.categoryFilter.create({
    data: baseFilter,
  });
};
