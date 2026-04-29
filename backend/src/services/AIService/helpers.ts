import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { AiParseResult } from "../../generated/prisma/client";
import {
  AIParseTarget,
  CategoryAttribute,
  FieldContext,
  getSystemFields,
  MappingTarget,
  MappingTargetType,
  TransformPayload,
} from "@engineering-data-normalizer/shared";
import {
  AiExample,
  AiParseResultData,
  AiSingleParseResult,
  ExtendedAIParseTarget,
} from "./types";
import { NormalizeSingleEntity } from "../NormalizationService/types";

export const generateBatchParsePrompts = (
  lines: {
    id: string;
    text: TransformPayload;
  }[],
  targets: AIParseTarget[],
  categoryName: string,
  exampleResults: Pick<
    AiParseResult,
    "rawValue" | "targetKey" | "sourceString"
  >[],
) => {
  const examples = formatAiResultsToExamples(exampleResults);

  const systemPrompt = `
Ты — экспертный инструмент для парсинга инженерной номенклатуры категории ${categoryName}.
Твоя задача: извлекать технические характеристики из строк номенклатуры.
Если параметр отсутствует или ты не уверен — пиши null.
НЕ повторяй значения. Значения должны быть короткими (только число или слово).
`.trim();

  const examplesBlock =
    examples.length > 0
      ? `Пример выполнения:\n${examples
          .map(
            (ex) =>
              `Входная строка: "${ex.sourceString}"\nРезультат:\n${JSON.stringify(ex.results, null, 2)}`,
          )
          .join("\n\n")}\n`
      : "";

  const prompt = `
Правила:
- Если параметр отсутствует или ты не уверен — пиши null
- Неправильно заполненный атрибут хуже null
- НЕ повторяй значения
- Значения должны быть короткими (только число или слово)
- В ответе sourceString указывай отдельно от rowId

${examplesBlock}

Атрибуты для извлечения:
${targets.map((t) => `- ${t.key} (${t.label})`).join("\n")}

Строки для парсинга:
${lines.map((l) => `${l.id}: ${l.text}`).join("\n")}
`.trim();

  return { systemPrompt, prompt };
};

export const generateSingleParsePrompts = (
  documentText: string,
  categoryName: string,
  attributes: Omit<CategoryAttribute, "type" | "options">[],
) => {
  const systemPrompt = `
Ты — экспертный ассистент по анализу технической документации в категории "${categoryName}".
Твоя задача: изучить текст и извлечь значения характеристик для КОНКРЕТНОЙ единицы оборудования.

Правила:
1. ПРИОРИТЕТ КОНКРЕТИКИ: В тексте могут быть указаны общие границы для всей серии (например, "давление до 16 бар"). Если в тексте указано точное значение для описываемой модели (например, "10 бар") — извлекай ТОЧНОЕ значение.
2. ИДЕНТИФИКАЦИЯ: Если в тексте упоминаются несколько модификаций, ориентируйся на ту, которая указана в заголовке или как основная модель.
3. Если параметр отсутствует в тексте — строго null. Не придумывай данные. Ошибочное значение хуже, чем пропуск (null).
4. Игнорируй общую информацию о компании, сертификатах и технике безопасности. Фокусируйся на технических данных модели.

Инструкция по формату значений:
- ЗНАЧЕНИЯ: Одиночные значения записывай как есть: "150 м".
- КОНВЕРТАЦИЯ: Если для атрибута указана предпочтительная единица измерения (например, Вт), а в тексте значение в других единицах (например, кВт) — по возможности выполни перевод (3 кВт -> 3000 Вт). Если не уверен в коэффициенте пересчета — оставляй как в тексте.
- ЕДИНИЦЫ ИЗМЕРЕНИЯ: Всегда сохраняй единицы измерения из текста рядом со значением (например: "160 м", "3.0 кВт", "80/65 мм").
- ДИАПАЗОНЫ: Если указан диапазон одной величины - записывай через тире: "10-20".
- СЛОЖНЫЕ ЗНАЧЕНИЯ: Если атрибут содержит два связанных значения (например, вход/выход или длина/ширина), разделяй их слэшем: "80/65".
- СПИСКИ: Если указано 3 и более варианта выбора — записывай через запятую: "50, 100, 150".
- ЛОГИКА: Для булевых полей используй "Да"/"Нет".
`.trim();

  const prompt = `
Атрибуты для поиска:
${attributes
  .map(
    (a) =>
      `- ${a.key} (${a.label})${a.unit ? `, предпочтительная единица измерения: ${a.unit}` : ""}`,
  )
  .join("\n")}

Текст для анализа:
---
${documentText}
---

Проанализируй текст и верни результат сопоставления.
`.trim();

  return { systemPrompt, prompt };
};

export const extractTextFromFile = async (
  fileBuffer: Buffer<ArrayBuffer>,
  fileExtension: string,
) => {
  let extractedText = "";

  if (fileExtension === "pdf") {
    const parser = new PDFParse({ data: fileBuffer });
    const result = await parser.getText();
    extractedText = result.text;
    await parser.destroy();
  } else if (fileExtension === "docx" || fileExtension === "doc") {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    extractedText = result.value;
  } else {
    throw new Error(
      `Формат .${fileExtension} пока не поддерживается для ИИ-анализа`,
    );
  }

  // ограничение объема текста для LLM (условно первые 15000 символов ~ 5-7 страниц)
  return extractedText.slice(0, 15000);
};

export const chunkArray = <T>(arr: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
};

// костыль для извлечения ключа из ссылки
// TODO: хранить в базе только ключи, а ссылки собирать на лету
export const extractS3Key = (url: string): string => {
  const bucketName = process.env.BUCKET_NAME;
  const parts = url.split(`${bucketName}/`);

  if (parts.length < 2) throw new Error("Невалидная ссылка на файл в S3");

  return decodeURIComponent(parts[1]);
};

export const prepareSingleImportTargets = (
  attributes: Omit<CategoryAttribute, "type" | "options">[],
): ExtendedAIParseTarget[] => {
  const systemTargets = Object.entries(getSystemFields(FieldContext.AI)).map(
    ([key, config]) => ({
      type: MappingTargetType.SYSTEM,
      key: key,
      label: config.label,
    }),
  );

  const attributeTargets = attributes.map((attr) => ({
    type: MappingTargetType.ATTRIBUTE,
    key: attr.key,
    label: attr.label,
    unit: attr.unit,
    attributeId: attr.id,
  }));

  return [...systemTargets, ...attributeTargets];
};

export const logAiParseResultData = (
  systemPrompt: string,
  prompt: string,
  data: AiParseResultData<any>,
) => {
  console.log(
    `[LOG]: ${new Date(Date.now()).toLocaleString()}\nTOKENS USAGE:`,
    data.tokensUsage,
  );
  console.log(`[LOG]: Model:\n${data.modelName}`);
  console.log(`[LOG]: System Prompt:\n${systemPrompt}`);
  console.log(`[LOG]: Prompt:\n${prompt}`);
  console.log(`[LOG]: Response text:\n${data.responseText}`);
};

export const transformAiResponseToNormalizeEntities = (
  aiResponse: AiSingleParseResult,
  targets: ExtendedAIParseTarget[],
): NormalizeSingleEntity[] => {
  return targets.map((target) => {
    const value = aiResponse[target.key];

    let mappingTarget: MappingTarget;

    if (target.type === MappingTargetType.SYSTEM) {
      mappingTarget = {
        type: MappingTargetType.SYSTEM,
        field: target.key as any,
      };
    } else {
      mappingTarget = {
        type: MappingTargetType.ATTRIBUTE,
        id: target.attributeId!,
      };
    }

    return {
      target: mappingTarget,
      value,
    };
  });
};

const formatAiResultsToExamples = (
  exampleResults: Pick<
    AiParseResult,
    "rawValue" | "targetKey" | "sourceString"
  >[],
): AiExample[] => {
  const grouped = exampleResults.reduce((acc, curr) => {
    const { sourceString, targetKey, rawValue } = curr;

    if (!acc.has(sourceString)) {
      acc.set(sourceString, {
        sourceString: sourceString,
        results: {},
      });
    }

    const example = acc.get(sourceString)!;
    example.results[targetKey] = rawValue === "null" ? null : rawValue;

    return acc;
  }, new Map<string, AiExample>());

  return Array.from(grouped.values());
};
