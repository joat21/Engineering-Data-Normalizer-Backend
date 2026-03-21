import { GoogleGenAI, Schema, ThinkingLevel, Type } from "@google/genai";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../../prisma/prisma";
import { Prisma } from "../../generated/prisma/client";
import { getRawValue } from "../../helpers/getRawValue";
import { TransformPayload } from "../NormalizationService/types";
import { EditedAiParseResult, ParseTarget } from "./types";
import { STAGING_IMPORT_ITEM_STATUS, TARGET_TYPE } from "../../config";

export const processAiParsing = async (data: {
  importSessionId: string;
  parsingSessionId?: string;
  colIndex: number;
  targets: ParseTarget[];
  testRowIds: string[];
}) => {
  const { importSessionId, parsingSessionId, colIndex, targets, testRowIds } =
    data;

  let sessionId;
  const isTestRun = !parsingSessionId;

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
      not: STAGING_IMPORT_ITEM_STATUS.EDITED_MANUALLY,
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

  const llmResults = await callLlmParser(linesToParse, targets);

  const recordsToSave: Prisma.AiParseResultCreateManyInput[] = [];

  for (const result of llmResults) {
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

  const headers = [
    { key: "sourceString", label: "Исходная строка" },
    ...targets.map((t) => ({
      key: t.type === TARGET_TYPE.ATTRIBUTE ? `attr_${t.key}` : t.key,
      label: t.label,
      type: t.type,
    })),
  ];

  const resultRows = llmResults.map((result) => {
    const row: Record<string, string | null> = {
      id: result.rowId,
      sourceString: result.sourceString,
    };

    for (const target of targets) {
      const columnKey =
        target.type === TARGET_TYPE.ATTRIBUTE
          ? `attr_${target.key}`
          : target.key;

      const value = result.extracted[target.key];

      row[columnKey] = String(value ?? "");
    }

    return row;
  });

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
    throw new Error("Parsing session not found");
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

const callLlmParser = async (
  lines: {
    id: string;
    text: TransformPayload;
  }[],
  targets: ParseTarget[],
): Promise<AiParseResult[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const responseSchema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        sourceString: { type: Type.STRING },
        rowId: { type: Type.STRING },
        extracted: {
          type: Type.OBJECT,
          properties: targets.reduce(
            (acc, t) => {
              acc[t.key] = { type: Type.STRING, nullable: true };
              return acc;
            },
            {} as Record<string, any>,
          ),
        },
      },
      required: ["rowId", "extracted"],
    },
  };

  const prompt = `
    Ты извлекаешь параметры из строк номенклатуры.

    Правила:
    - Отвечай СТРОГО валидным JSON
    - НЕ повторяй значения
    - НЕ добавляй пояснения
    - Значения короткие (число или слово)
    - Если сильно не уверен — пиши атрибуту значение null
    - Неправильно заполненный атрибут хуже null

    Атрибуты:
    ${targets.map((t) => `- ${t.key} (${t.label})`).join("\n")}

    Строки:
    ${lines.map((l) => `${l.id}: ${l.text}`).join("\n")}
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.MINIMAL,
      },
      maxOutputTokens: 10000,
      systemInstruction:
        "Ты — инженерный парсер. Твоя задача: извлекать технические характеристики из строк номенклатуры. Если значение не найдено, пиши null. Не выдумывай данные.",
    },
  });

  console.log(
    `[LOG]: ${new Date(Date.now()).toLocaleString()}\nTOKENS USAGE:`,
    response.usageMetadata,
  );

  return JSON.parse(response.text || "") as AiParseResult[];
};

type AiParseResult = {
  rowId: string;
  sourceString: string;
  extracted: Record<string, string | number | boolean | null>;
};
