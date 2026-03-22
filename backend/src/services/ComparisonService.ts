import { prisma } from "../prisma";
import { SYSTEM_FIELDS_CONFIG } from "../config";
import { EquipmentSystemFields } from "../types";

type ComparisonGroup = {
  categoryId: string;
  categoryName: string;
  fields: { key: string; label: string }[];
  items: {
    id: string;
    equipmentId: string;
    values: Record<string, string>;
  }[];
};

export const addToComparison = async (userId: string, equipmentId: string) => {
  let comparison = await prisma.comparison.findFirst({
    where: { userId },
  });

  if (!comparison) {
    comparison = await prisma.comparison.create({
      data: { userId },
    });
  }

  return await prisma.comparisonItem.upsert({
    where: {
      comparisonId_equipmentId: {
        comparisonId: comparison.id,
        equipmentId,
      },
    },
    create: {
      comparisonId: comparison.id,
      equipmentId,
    },
    update: {},
  });
};

export const removeFromComparison = async (itemId: string) => {
  return await prisma.comparisonItem.delete({
    where: { id: itemId },
  });
};

export const getComparisonTable = async (userId: string) => {
  const comparison = await prisma.comparison.findFirst({
    where: { userId },
    include: {
      items: {
        include: {
          equipment: {
            include: {
              category: {
                include: {
                  attributes: true,
                },
              },
              attributes: true,
            },
          },
        },
      },
    },
  });

  if (!comparison) return [];

  const groupedData = new Map<string, ComparisonGroup>();

  comparison.items.forEach((item) => {
    const equipment = item.equipment;
    const category = equipment.category;

    if (!groupedData.has(category.id)) {
      const fields = [
        ...Object.entries(SYSTEM_FIELDS_CONFIG).map(([key, config]) => ({
          key,
          label: config.label,
        })),
        ...category.attributes.map((attr) => ({
          key: attr.id,
          label: attr.label,
        })),
      ];

      groupedData.set(category.id, {
        categoryId: category.id,
        categoryName: category.name,
        fields,
        items: [],
      });
    }

    const values: Record<string, string> = {};

    Object.keys(SYSTEM_FIELDS_CONFIG).forEach((key) => {
      const val = equipment[key as keyof EquipmentSystemFields];
      values[key] =
        val === null || val === undefined || val === "" ? "—" : String(val);
    });

    equipment.attributes.forEach((attrVal) => {
      values[attrVal.attributeId] = attrVal.valueString || "—";
    });

    const categoryGroup = groupedData.get(category.id);
    categoryGroup?.items.push({
      id: item.id,
      equipmentId: equipment.id,
      values,
    });
  });

  return Array.from(groupedData.values());
};
