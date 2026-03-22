import { v4 as uuidv4 } from "uuid";
import {
  NormalizationOption,
  NormalizedValue,
} from "../services/NormalizationService/types";
import { prisma } from "../prisma";

export const getAttributeOptionsMap = async (
  attributeIds: string[],
): Promise<Map<string, NormalizationOption[]>> => {
  const optionsMap = new Map<string, NormalizationOption[]>();

  if (attributeIds.length === 0) {
    return optionsMap;
  }

  const cache = await prisma.$queryRaw<
    { attributeId: string; normalized: NormalizedValue }[]
  >`
    SELECT DISTINCT ON ("attributeId", "normalized"->>'valueString')
      "attributeId",
      "normalized"
    FROM "NormalizationCache"
    WHERE "attributeId"::uuid = ANY(${attributeIds}::uuid[])
  `;

  cache.forEach((entry) => {
    if (!optionsMap.has(entry.attributeId)) {
      optionsMap.set(entry.attributeId, []);
    }

    optionsMap.get(entry.attributeId)!.push({
      id: uuidv4(),
      label: entry.normalized.valueString,
      normalized: entry.normalized,
    });
  });

  return optionsMap;
};
