import mammoth from "mammoth";
import {
  AIParseTarget,
  TransformPayload,
} from "@engineering-data-normalizer/shared";
import { PDFParse } from "pdf-parse";

export const generatePrompts = (
  lines: {
    id: string;
    text: TransformPayload;
  }[],
  targets: AIParseTarget[],
  categoryName: string,
) => {
  const systemPrompt = `
  Ты — экспертный инструмент для парсинга инженерной номенклатуры категории ${categoryName}.
  Твоя задача: извлекать технические характеристики из строк номенклатуры.
  Если параметр отсутствует или ты не уверен — пиши null.
  НЕ повторяй значения. Значения должны быть короткими (только число или слово).
  `.trim();

  const prompt = `
  Правила:
  - Если параметр отсутствует или ты не уверен — пиши null
  - Неправильно заполненный атрибут хуже null
  - НЕ повторяй значения
  - Значения должны быть короткими (только число или слово)
  - В ответе sourceString указывай отдельно от rowId

  Атрибуты для извлечения:
  ${targets.map((t) => `- ${t.key} (${t.label})`).join("\n")}

  Строки для парсинга:
  ${lines.map((l) => `${l.id}: ${l.text}`).join("\n")}
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
