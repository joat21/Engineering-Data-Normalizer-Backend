import path from "path";
import {
  StagingColumn,
  SourceType,
  StagingRow,
} from "@engineering-data-normalizer/shared";
import { prisma } from "../../prisma";
import { calculateHashAsync } from "../../helpers/calculateHashAsync";
import { uploadToS3 } from "../S3Service";
import { createSource } from "../SourceService";
import { TransformedRow } from "../NormalizationService/types";
import { getAttributeInfoMap } from "../../db/categoryAttribute";
import { isSubColumn } from "./types";
import {
  getTargetLabel,
  getTargetUnit,
  processFileForPreview,
} from "./helpers";
import { ApiError } from "../../exceptions/api-error";
import { CONVERTIBLE_EXTENSIONS, SYSTEM_FIELDS } from "../../config";
import { getTargetKey } from "../../helpers/getTargetKey";

export const createSession = async (data: {
  categoryId: string;
  sourceType: SourceType;
  file: Express.Multer.File;
  originHeader?: string[];
  manufacturerId?: string;
  supplierId?: string;
  currencyId: string;
}) => {
  const {
    categoryId,
    sourceType,
    file,
    originHeader,
    manufacturerId,
    supplierId,
    currencyId,
  } = data;

  const fileHash = await calculateHashAsync(file.buffer);

  let source = await prisma.source.findUnique({
    where: { fileHash },
  });

  let originalUrl = source?.url;
  let pdfUrl = "";

  const ext = path.extname(file.originalname).toLowerCase();
  const isPdf = ext === ".pdf";

  if (!source) {
    const mainKey = `imports/${fileHash}-${file.originalname}`;

    originalUrl = await uploadToS3({
      key: mainKey,
      body: file.buffer,
      contentType: file.mimetype,
    });

    const pdfBuffer = await processFileForPreview(file);

    if (pdfBuffer) {
      await uploadToS3({
        key: `${mainKey}.pdf`,
        body: pdfBuffer,
        contentType: "application/pdf",
      });
    }

    source = await createSource({
      fileName: file.originalname,
      url: originalUrl,
      fileHash,
      type: sourceType,
      manufacturerId,
      supplierId,
    });
  }

  if (isPdf) {
    pdfUrl = originalUrl!;
  } else if (CONVERTIBLE_EXTENSIONS.includes(ext)) {
    pdfUrl = `${originalUrl}.pdf`;
  } else {
    pdfUrl = "";
  }

  const session = await prisma.importSession.create({
    data: {
      categoryId,
      sourceId: source.id,
      originHeader,
      manufacturerId,
      supplierId,
      currencyId,
    },
  });

  return {
    sessionId: session.id,
    pdfUrl: pdfUrl,
  };
};

export const addItemsToStaging = async (data: {
  sessionId: string;
  rows: (string | number)[][];
}) => {
  const session = await prisma.importSession.findUnique({
    where: { id: data.sessionId },
  });

  if (!session) {
    throw ApiError.NotFound("Сессия импорта не найдена");
  }

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
    select: {
      originHeader: true,
      currency: {
        select: { symbol: true },
      },
    },
  });

  if (!session) {
    throw ApiError.NotFound("Сессия импорта не найдена");
  }

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

  const columns: StagingColumn[] = rawRow.flatMap((_, index) => {
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

    return mappings.map((mapping, subIndex) => {
      const targetKey = getTargetKey(mapping.target);
      const unit =
        targetKey === SYSTEM_FIELDS.PRICE
          ? session.currency?.symbol
          : getTargetUnit(mapping.target, attributeInfoMap);

      return {
        id: `c${index}_v${subIndex}`,
        label: getTargetLabel(mapping.target, attributeInfoMap),
        unit,
        originIndex: index,
        subIndex,
      };
    });
  });

  const rows: StagingRow[] = items.map((item) => {
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

export const deleteStagingItems = async (ids: string[]) => {
  return prisma.$transaction(async (tx) => {
    await tx.aiParseResult.deleteMany({
      where: { sourceItemId: { in: ids } },
    });

    const result = await tx.stagingImportItem.deleteMany({
      where: { id: { in: ids } },
    });

    return result;
  });
};
