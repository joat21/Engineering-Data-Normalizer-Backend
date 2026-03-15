import { getCacheMap, getMappingPlans, getTypeMap } from "./helpers";
import { applyTransform } from "./transformers";
import { MappingTarget, TransformedRow, TransformConfig } from "./types";
import { prisma } from "../../../prisma/prisma";
import { getRawValue } from "../../helpers/getRawValue";

export const mapColumnToAttribute = async (params: {
  sessionId: string;
  colIndex: number;
  target: MappingTarget;
}) =>
  updateColumn(
    params.sessionId,
    params.colIndex,
    [params.target],
    (rawValue) => [rawValue],
  );

export const applyColumnTransformation = async (params: {
  sessionId: string;
  colIndex: number;
  transform: TransformConfig;
  targets: (MappingTarget | null)[];
}) =>
  updateColumn(params.sessionId, params.colIndex, params.targets, (rawValue) =>
    applyTransform(rawValue, params.transform),
  );

const updateColumn = async (
  sessionId: string,
  colIndex: number,
  targets: (MappingTarget | null)[],
  getUpdatedData: (rawValue: any) => any[],
) => {
  const typeMap = await getTypeMap(targets);

  const items = await prisma.stagingImportItem.findMany({
    where: { sessionId },
    select: { id: true, rawRow: true, transformedRow: true },
  });

  const cacheMap = await getCacheMap(
    targets,
    items,
    typeMap,
    colIndex,
    getUpdatedData,
  );

  const mappingPlans = getMappingPlans(targets, typeMap);

  const dataToUpdate = items.map((item) => {
    const rawValue = getRawValue(item.rawRow, colIndex);
    const updatedData = getUpdatedData(rawValue);

    const columnMappings = mappingPlans
      .map((plan, i) => {
        if (!plan) return null;

        const valueToNormalize = String(updatedData[i] ?? "");
        return {
          target: plan.target,
          rawValue: String(rawValue),
          normalized: plan.normalizer(valueToNormalize, cacheMap),
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
