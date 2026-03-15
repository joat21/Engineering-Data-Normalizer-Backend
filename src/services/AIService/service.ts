import { GoogleGenAI, Schema, ThinkingLevel, Type } from "@google/genai";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../../../prisma/prisma";
import { Prisma } from "../../generated/prisma/client";
import { getRawValue } from "../../helpers/getRawValue";
import { TransformPayload } from "../NormalizationService/types";
import { ParseTarget } from "./types";
import { TARGET_TYPE } from "../../config";

export async function processAiParsing(data: {
  importSessionId: string;
  colIndex: number;
  targets: ParseTarget[];
}) {
  const sessionId = uuidv4();
  const { importSessionId, colIndex, targets } = data;

  const rows = await prisma.stagingImportItem.findMany({
    where: { sessionId: importSessionId },
    select: { id: true, rawRow: true },
  });

  const linesToParse = rows
    .map((r) => ({
      id: r.id,
      text: getRawValue(r.rawRow, colIndex),
    }))
    .filter((line) => !!line.text);

  const llmResults = await callLlmParser(linesToParse, targets);

  const recordsToSave: Prisma.AiExtractionResultCreateManyInput[] = [];

  for (const result of llmResults) {
    const { rowId, extracted } = result;

    for (const target of targets) {
      const value = extracted[target.key];

      recordsToSave.push({
        sessionId,
        sourceItemId: rowId,
        target: target.key,
        targetType: target.type,
        rawValue: String(value),
      });
    }
  }

  prisma.aiExtractionResult.createMany({
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
    sessionId,
    headers,
    rows: [...resultRows],
  };
}

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
    Распарси следующие строки номенклатуры.
    Используй эти ключи для атрибутов:
    ${targets.map((t) => `- ${t.key} (Смысл: ${t.label})`).join("\n")}

    СТРОКИ ДЛЯ ПАРСИНГА:
    ${JSON.stringify(lines)}
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
      systemInstruction:
        "Ты — инженерный парсер. Твоя задача: извлекать технические характеристики из строк номенклатуры. Если значение не найдено, пиши null. Не выдумывай данные.",
    },
  });

  console.log("[LOG]: TOKENS USAGE:", response.usageMetadata);

  return JSON.parse(response.text || "") as AiParseResult[];
};

type AiParseResult = {
  rowId: string;
  sourceString: string;
  extracted: Record<string, string | number | boolean | null>;
};
