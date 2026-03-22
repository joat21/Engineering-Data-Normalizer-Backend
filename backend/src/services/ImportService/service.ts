import { prisma } from "../../prisma";
import { calculateHashAsync } from "../../helpers/calculateHashAsync";
import { uploadFile } from "../S3Service";
import { createSource } from "../SourceService";
import { SourceType } from "../../types";
import { TransformedRow } from "../NormalizationService/types";
import { getAttributeInfoMap } from "../../db/categoryAttribute";
import { ColumnMetadata, isSubColumn } from "./types";
import { getTargetLabel } from "./helpers";

export const createSession = async (data: {
  categoryId: string;
  sourceType: SourceType;
  file: Express.Multer.File;
  originHeader?: string[];
}) => {
  const fileHash = await calculateHashAsync(data.file.buffer);
  let source = await prisma.source.findUnique({
    where: { fileHash },
  });

  if (!source) {
    const url = await uploadFile(data.file);
    source = await createSource({
      fileName: data.file.originalname,
      url,
      fileHash,
      type: data.sourceType,
    });
  }

  const session = await prisma.importSession.create({
    data: {
      categoryId: data.categoryId,
      sourceId: source.id,
      originHeader: data.originHeader,
    },
  });

  return session.id;
};

export const addItemsToStaging = async (data: {
  sessionId: string;
  rows: (string | number)[][];
}) => {
  const session = await prisma.importSession.findUnique({
    where: { id: data.sessionId },
  });

  if (!session) throw new Error("Session not found");

  await prisma.stagingImportItem.createMany({
    data: data.rows.map((row, i) => ({
      sessionId: data.sessionId,
      rawRow: row,
      rowIndex: i,
    })),
  });
};

export const getStagingTable = async (sessionId: string) => {
  const session = await prisma.importSession.findUnique({
    where: { id: sessionId },
    select: { originHeader: true },
  });

  if (!session) throw new Error("Session not found");

  const originHeader = (session.originHeader as string[]) || [];

  const items = await prisma.stagingImportItem.findMany({
    where: { sessionId },
    orderBy: { rowIndex: "asc" },
  });

  const firstItem = items[0];
  const transformedRow =
    (firstItem?.transformedRow as unknown as TransformedRow) || {};
  const rawRow = (firstItem?.rawRow as any[]) || [];

  const allTargets = Object.values(transformedRow)
    .flat()
    .map((m) => m.target);

  const attributeInfoMap = await getAttributeInfoMap(allTargets);

  const columns: ColumnMetadata[] = rawRow.flatMap((_, index) => {
    const mappings = transformedRow[index] || [];

    if (mappings.length === 0) {
      return [
        {
          id: `c${index}`,
          label: originHeader[index] || `Колонка ${index + 1}`,
          originIndex: index,
        },
      ];
    }

    if (mappings.length === 1) {
      return [
        {
          id: `c${index}`,
          label: getTargetLabel(mappings[0].target, attributeInfoMap),
          originIndex: index,
        },
      ];
    }

    return mappings.map((mapping, subIndex) => ({
      id: `c${index}_v${subIndex}`,
      label: getTargetLabel(mapping.target, attributeInfoMap),
      originIndex: index,
      subIndex,
    }));
  });

  const rows = items.map((item) => {
    const rawRow = item.rawRow as any[];
    const transformedRow =
      (item.transformedRow as unknown as TransformedRow) || {};

    const values: Record<string, string> = {};

    columns.forEach((col) => {
      const colMappings = transformedRow[col.originIndex] || [];

      if (isSubColumn(col)) {
        const mapping = colMappings[col.subIndex];
        values[col.id] = mapping?.normalized?.valueString || "";
      } else {
        const mapping = colMappings[0];
        values[col.id] =
          mapping?.normalized?.valueString ||
          String(rawRow[col.originIndex] || "");
      }
    });

    return {
      id: item.id,
      rowIndex: item.rowIndex,
      values,
    };
  });

  return { columns, rows };
};
