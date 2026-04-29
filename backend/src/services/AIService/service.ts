import pMap from "p-map";
import {
  EditedAiParseResult,
  AIParseTarget,
  MappingTargetType,
  AiParseFileResult,
} from "@engineering-data-normalizer/shared";
import { downloadFromS3 } from "../S3Service";
import { llmBatchParse, llmSingleParse } from "./parsers";
import {
  chunkArray,
  extractS3Key,
  extractTextFromFile,
  prepareSingleImportTargets,
  transformAiResponseToNormalizeEntities,
} from "./helpers";
import { CHUNK_SIZE, CONCURRENCY } from "./config";
import { prisma } from "../../prisma";
import { Prisma } from "../../generated/prisma/client";
import { getRawValue } from "../../helpers/getRawValue";
import { StagingImportItemStatus } from "../../types";
import { ApiError } from "../../exceptions/api-error";
import { normalizeSingleImport } from "../NormalizationService/service";
import { TransformedRow } from "../NormalizationService/types";

export const processAiParsing = async (data: {
  importSessionId: string;
  parsingSessionId?: string;
  colIndex: number;
  subIndex?: number;
  targets: AIParseTarget[];
  testRowIds: string[];
}) => {
  const {
    importSessionId,
    parsingSessionId,
    colIndex,
    subIndex,
    targets,
    testRowIds,
  } = data;

  let sessionId: string;
  const isTestRun = !parsingSessionId;

  const importSession = await prisma.importSession.findUnique({
    where: { id: importSessionId },
    include: {
      category: {
        select: { name: true },
      },
    },
  });

  if (!importSession) {
    throw ApiError.NotFound("Сессия импорта не найдена");
  }

  if (!parsingSessionId) {
    const parsingSession = await prisma.aiParseSession.create({
      data: { importSessionId },
    });
    sessionId = parsingSession.id;
  } else {
    sessionId = parsingSessionId;
  }

  const where: Prisma.StagingImportItemWhereInput = {
    sessionId: importSessionId,
    status: {
      not: StagingImportItemStatus.EDITED_MANUALLY,
    },
    id: isTestRun
      ? { in: testRowIds }
      : {
          notIn: testRowIds,
        },
  };

  const rows = await prisma.stagingImportItem.findMany({
    where,
    select: {
      id: true,
      rawRow: true,
      rowIndex: true,
      transformedRow: true,
    },
  });

  const linesToParse = rows
    .map((r) => {
      let text = "";
      if (subIndex !== undefined) {
        const mappedCol = (r.transformedRow as TransformedRow)[colIndex];
        text = mappedCol?.[subIndex]?.normalized?.valueString ?? "";
      } else {
        text = String(getRawValue(r.rawRow, colIndex) ?? "");
      }

      return { id: r.id, text };
    })
    .filter((line) => !!line.text);

  const chunks = chunkArray(linesToParse, CHUNK_SIZE);

  const exampleResults = await prisma.aiParseResult.findMany({
    where: { sessionId },
    select: { sourceString: true, targetKey: true, rawValue: true },
  });

  const batchResults = await pMap(
    chunks,
    async (chunk) => {
      return await llmBatchParse(
        chunk,
        targets,
        importSession.category.name,
        exampleResults,
      );
    },
    { concurrency: CONCURRENCY },
  );

  const parseResults = batchResults.flat();

  const recordsToSave: Prisma.AiParseResultCreateManyInput[] = [];

  for (const result of parseResults) {
    const { rowId, sourceString, extracted } = result;

    for (const target of targets) {
      const value = extracted[target.key];

      recordsToSave.push({
        sessionId,
        sourceItemId: rowId,
        targetKey: target.key,
        targetType: target.type,
        rawValue: String(value),
        sourceString,
      });
    }
  }

  await prisma.aiParseResult.createMany({
    data: recordsToSave,
  });

  const allResults = await prisma.aiParseResult.findMany({
    where: { sessionId },
    include: {
      sourceItem: {
        select: {
          rawRow: true,
        },
      },
    },
    orderBy: {
      sourceItem: {
        rowIndex: "asc",
      },
    },
  });

  const groupedMap = new Map<
    string,
    { id: string; sourceString: string; valuesMap: Record<string, string> }
  >();

  for (const res of allResults) {
    if (!groupedMap.has(res.sourceItemId)) {
      let sourceString = "";

      if (subIndex !== undefined) {
        sourceString = res.sourceString;
      } else {
        sourceString = String(
          getRawValue(res.sourceItem.rawRow, colIndex) ?? "",
        );
      }

      groupedMap.set(res.sourceItemId, {
        id: res.sourceItemId,
        sourceString,
        valuesMap: {},
      });
    }

    groupedMap.get(res.sourceItemId)!.valuesMap[res.targetKey] = res.rawValue;
  }

  const headers = [
    { key: "sourceString", label: "Исходная строка" },
    ...targets,
  ];

  const resultRows = Array.from(groupedMap.values()).map((row) => ({
    id: row.id,
    sourceString: row.sourceString,
    values: targets.map((target) => row.valuesMap[target.key] ?? ""),
  }));

  return {
    parsingSessionId: sessionId,
    sourceColIndex: colIndex,
    headers,
    rows: resultRows,
  };
};

export const editAiParseResults = async (
  parsingSessionId: string,
  editedValues: EditedAiParseResult[],
) => {
  if (!editedValues.length) {
    return { updated: 0 };
  }

  const exists = await prisma.aiParseResult.findFirst({
    where: { sessionId: parsingSessionId },
    select: { id: true },
  });

  if (!exists) {
    throw ApiError.NotFound("Сессия ИИ-анализа не найдена");
  }

  const payload = JSON.stringify(editedValues);

  const updated = await prisma.$executeRaw`
    UPDATE "AiParseResult" AS t
    SET
      "rawValue" = v."newRawValue"
    FROM json_to_recordset(${payload}::json) AS v(
      "sourceItemId" uuid,
      "targetKey" text,
      "newRawValue" text
    )
    WHERE
      t."sessionId" = ${parsingSessionId}::uuid
      AND t."sourceItemId" = v."sourceItemId"
      AND t."targetKey" = v."targetKey"
  `;

  await prisma.$executeRaw`
    UPDATE "StagingImportItem" AS s
    SET "status" = 'EDITED_MANUALLY'
    FROM (
      SELECT DISTINCT "sourceItemId"
      FROM json_to_recordset(${payload}::json) AS v(
        "sourceItemId" uuid,
        "targetKey" text, 
        "newRawValue" text
      )
    ) AS edited
    WHERE s.id = edited."sourceItemId"
  `;

  return { updated };
};

export const parseFile = async (importSessionId: string) => {
  const session = await prisma.importSession.findUnique({
    where: { id: importSessionId },
    include: {
      source: {
        select: { url: true },
      },
      category: {
        include: {
          attributes: true,
        },
      },
    },
  });

  if (!session?.source.url) {
    throw new Error("Файл не найден в сессии импорта");
  }

  const targets = prepareSingleImportTargets(session.category.attributes);
  const fileUrl = session.source.url;
  const extension = fileUrl.split(".").pop()?.toLowerCase();
  const storageKey = extractS3Key(fileUrl);

  const fileBuffer = await downloadFromS3(storageKey);
  const extractedText = await extractTextFromFile(fileBuffer, extension ?? "");

  const parseResult = await llmSingleParse(
    extractedText,
    session.category.name,
    session.category.attributes,
    targets,
  );

  const entitiesToNormalize = transformAiResponseToNormalizeEntities(
    parseResult,
    targets,
  );

  const normalizedData = await normalizeSingleImport(entitiesToNormalize);

  return normalizedData.reduce((acc, item) => {
    const key =
      item.target.type === MappingTargetType.SYSTEM
        ? item.target.field
        : item.target.id;

    acc[key] = item.normalized;

    return acc;
  }, {} as AiParseFileResult);
};
