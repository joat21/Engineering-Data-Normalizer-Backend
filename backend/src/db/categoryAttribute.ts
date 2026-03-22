import { prisma } from "../prisma";
import { TARGET_TYPE } from "../config";
import { Prisma } from "../generated/prisma/client";
import {
  AttributeInfo,
  AttributeTarget,
  MappingTarget,
} from "../services/NormalizationService/types";

export const getAttributeInfoMap = async (
  targets: (MappingTarget | null)[],
  tx?: Prisma.TransactionClient,
) => {
  const db = tx || prisma;

  const attrIds = targets
    .filter((t): t is AttributeTarget => t?.type === TARGET_TYPE.ATTRIBUTE)
    .map((t) => t.id);

  if (attrIds.length === 0) {
    return new Map<string, AttributeInfo>();
  }

  const attributes = await db.categoryAttribute.findMany({
    where: { id: { in: attrIds } },
    select: { id: true, dataType: true, label: true },
  });

  return new Map<string, AttributeInfo>(
    attributes.map((a) => [a.id, { dataType: a.dataType, label: a.label }]),
  );
};
