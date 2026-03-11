import { getRawValue } from "./helpers";
import { normalizeValue, isSimpleNumeric } from "./normalizers";
import { applyTransform } from "./transformers";
import { TransformedRow } from "./types";
import { TransformConfig } from "../../schemas/normalization";
import { prisma } from "../../../prisma/prisma";

export const mapColumnToAttribute = async (params: {
  sessionId: string;
  colIndex: number;
  attributeId: string;
}) =>
  updateColumn(
    params.sessionId,
    params.colIndex,
    [params.attributeId],
    (rawValue) => [rawValue],
  );

export const applyColumnTransformation = async (params: {
  sessionId: string;
  colIndex: number;
  transform: TransformConfig;
  attributesOrder: (string | null)[];
}) =>
  updateColumn(
    params.sessionId,
    params.colIndex,
    params.attributesOrder,
    (rawValue) => applyTransform(rawValue, params.transform),
  );

const updateColumn = async (
  sessionId: string,
  colIndex: number,
  attributeIds: (string | null)[],
  getUpdatedData: (rawValue: any) => any[],
) => {
  const validAttrIds = attributeIds.filter((id) => id !== null);

  const attributes = await prisma.categoryAttribute.findMany({
    where: { id: { in: validAttrIds } },
    select: { id: true, dataType: true },
  });
  const typeMap = new Map(attributes.map((a) => [a.id, a.dataType]));

  const items = await prisma.stagingImportItem.findMany({
    where: { sessionId },
    select: { id: true, rawRow: true, transformedRow: true },
  });

  const cacheLookupSet = new Set<string>();

  items.forEach((item) => {
    const rawValue = getRawValue(item.rawRow, colIndex);
    const updatedData = getUpdatedData(rawValue);

    attributeIds.forEach((attrId, i) => {
      if (!attrId) return null;

      const val = String(updatedData[i] ?? "")
        .toLowerCase()
        .trim();
      const attrType = typeMap.get(attrId);

      if (attrType !== "NUMBER") {
        cacheLookupSet.add(`${attrId}:${val}`);
      } else {
        const parts = val.split(/[\s]*[xх×][\s]*/).filter((p) => p.length > 0);
        parts.forEach((p) => {
          if (!isSimpleNumeric(p)) {
            cacheLookupSet.add(`${attrId}:${p.trim()}`);
          }
        });
      }
    });
  });

  const cacheEntries = await prisma.normalizationCache.findMany({
    where: {
      OR: Array.from(cacheLookupSet).map((pair) => {
        const [attrId, clean] = pair.split(":");
        return { attributeId: attrId, cleanedValue: clean };
      }),
    },
  });

  const cacheMap = new Map(
    cacheEntries.map((e) => [
      `${e.attributeId}:${e.cleanedValue}`,
      e.normalized,
    ]),
  );

  const dataToUpdate = items.map((item) => {
    const rawValue = getRawValue(item.rawRow, colIndex);
    const updatedData = getUpdatedData(rawValue);

    const columnMappings = attributeIds
      .map((attrId, i) => {
        if (!attrId) return null;

        const valueToNormalize = String(updatedData[i] ?? "");
        const attrType = typeMap.get(attrId) || "STRING";

        return {
          attributeId: attrId,
          rawValue: String(rawValue),
          normalized: normalizeValue(
            valueToNormalize,
            attrType,
            attrId,
            cacheMap,
          ),
        };
      })
      .filter((m) => m !== null);

    const existingRow =
      (item.transformedRow as unknown as TransformedRow) || {};

    const newData: TransformedRow = {
      ...existingRow,
      [colIndex.toString()]: columnMappings,
    };

    return {
      id: item.id,
      transformedRow: JSON.stringify(newData).replace(/'/g, "''"),
    };
  });

  if (dataToUpdate.length === 0) return { success: true, count: 0 };

  const values = dataToUpdate
    .map((d) => `('${d.id}'::uuid, '${d.transformedRow}'::jsonb)`)
    .join(",");

  await prisma.$executeRawUnsafe(`
    UPDATE "StagingImportItem" AS t
    SET "transformedRow" = v.new_val
    FROM (VALUES ${values}) AS v(id, new_val)
    WHERE t.id = v.id;
  `);
};
