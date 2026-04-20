import {
  EditedAiParseResult,
  AIParseTarget,
} from "@engineering-data-normalizer/shared";
import { prisma } from "../../prisma";
import { Prisma } from "../../generated/prisma/client";
import { getRawValue } from "../../helpers/getRawValue";
import { StagingImportItemStatus } from "../../types";
import { ApiError } from "../../exceptions/api-error";
import { llmParse } from "./parsers";
import { chunkArray, extractS3Key, extractTextFromFile } from "./helpers";
import { CHUNK_SIZE, CONCURRENCY } from "./config";
import pMap from "p-map";
import { downloadFromS3 } from "../S3Service";

export const processAiParsing = async (data: {
  importSessionId: string;
  parsingSessionId?: string;
  colIndex: number;
  targets: AIParseTarget[];
  testRowIds: string[];
}) => {
  const { importSessionId, parsingSessionId, colIndex, targets, testRowIds } =
    data;

  let sessionId;
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
    },
  });

  const linesToParse = rows
    .map((r) => ({
      id: r.id,
      text: getRawValue(r.rawRow, colIndex),
    }))
    .filter((line) => !!line.text);

  const chunks = chunkArray(linesToParse, CHUNK_SIZE);

  const batchResults = await pMap(
    chunks,
    async (chunk) => {
      return await llmParse(chunk, targets, importSession.category.name);
    },
    { concurrency: CONCURRENCY },
  );

  const parseResults = batchResults.flat();

  const recordsToSave: Prisma.AiParseResultCreateManyInput[] = [];

  for (const result of parseResults) {
    const { rowId, extracted } = result;

    for (const target of targets) {
      const value = extracted[target.key];

      recordsToSave.push({
        sessionId,
        sourceItemId: rowId,
        targetKey: target.key,
        targetType: target.type,
        rawValue: String(value),
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
          rowIndex: true,
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
      groupedMap.set(res.sourceItemId, {
        id: res.sourceItemId,
        sourceString: getRawValue(res.sourceItem.rawRow, colIndex),
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
        select: {
          name: true,
        },
      },
    },
  });

  if (!session?.source.url) {
    throw new Error("Файл не найден в сессии импорта");
  }

  const fileUrl = session.source.url;
  const extension = fileUrl.split(".").pop()?.toLowerCase();
  const storageKey = extractS3Key(fileUrl);

  const fileBuffer = await downloadFromS3(storageKey);
  const extractedText = extractTextFromFile(fileBuffer, extension ?? "");

  return extractedText;
};
