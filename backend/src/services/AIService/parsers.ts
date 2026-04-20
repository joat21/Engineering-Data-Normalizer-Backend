import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { GoogleGenAI, Schema, ThinkingLevel, Type } from "@google/genai";
import z from "zod";
import {
  AIParseTarget,
  CategoryAttribute,
  TransformPayload,
} from "@engineering-data-normalizer/shared";
import {
  generateBatchParsePrompts,
  generateSingleParsePrompts,
  logAiParseResultData,
  prepareSingleImportTargets,
} from "./helpers";
import {
  AiBatchParseResult,
  AiBatchParseResultData,
  AiSingleParseResult,
  AiSingleParseResultData,
} from "./types";

export const llmBatchParse = async (
  lines: {
    id: string;
    text: TransformPayload;
  }[],
  targets: AIParseTarget[],
  categoryName: string,
): Promise<AiBatchParseResult[]> => {
  const { systemPrompt, prompt } = generateBatchParsePrompts(
    lines,
    targets,
    categoryName,
  );

  // const { tokensUsage, parsed, responseText, modelName } = await googleAiBatchParse(systemPrompt, prompt, targets);
  const result = await yandexAiBatchParse(systemPrompt, prompt, targets);
  const { tokensUsage, parsed, responseText, modelName } = result;

  console.log(
    `[LOG]: ${new Date(Date.now()).toLocaleString()}\nTOKENS USAGE:`,
    tokensUsage,
  );
  console.log(`[LOG]: Model:\n${modelName}`);
  console.log(`[LOG]: System Prompt:\n${systemPrompt}`);
  console.log(`[LOG]: Prompt:\n${prompt}`);
  console.log(`[LOG]: Response text:\n${responseText}`);

  return parsed;
};

export const llmSingleParse = async (
  documentText: string,
  categoryName: string,
  // TODO: костыль на деле то, стоит типизацию переработать
  attributes: Omit<CategoryAttribute, "type" | "options">[],
): Promise<AiSingleParseResult> => {
  const { systemPrompt, prompt } = generateSingleParsePrompts(
    documentText,
    categoryName,
    attributes,
  );

  const targets = prepareSingleImportTargets(attributes);
  const result = await yandexAiSingleParse(systemPrompt, prompt, targets);
  const { tokensUsage, parsed, responseText, modelName } = result;

  console.log(
    `[LOG]: ${new Date(Date.now()).toLocaleString()}\nTOKENS USAGE:`,
    tokensUsage,
  );
  console.log(`[LOG]: Model:\n${modelName}`);
  console.log(`[LOG]: System Prompt:\n${systemPrompt}`);
  console.log(`[LOG]: Prompt:\n${prompt}`);
  console.log(`[LOG]: Response text:\n${responseText}`);

  logAiParseResultData(systemPrompt, prompt, result);

  return parsed;
};

const yandexAiBatchParse = async (
  systemPrompt: string,
  prompt: string,
  targets: AIParseTarget[],
): Promise<AiBatchParseResultData> => {
  const modelName = "qwen3.5-35b-a3b-fp8/latest";
  // const modelName = "aliceai-llm/latest";

  const client = new OpenAI({
    apiKey: process.env.YANDEX_CLOUD_API_KEY,
    baseURL: "https://ai.api.cloud.yandex.net/v1",
    defaultHeaders: {
      "OpenAI-Project": process.env.YANDEX_CLOUD_FOLDER,
    },
  });

  const extractedShape = targets.reduce(
    (acc, t) => {
      acc[t.key] = z.string().nullable();
      return acc;
    },
    {} as Record<string, z.ZodTypeAny>,
  );

  const engineeringSchema = z.object({
    items: z.array(
      z.object({
        rowId: z.string(),
        sourceString: z.string(),
        extracted: z.object(extractedShape),
      }),
    ),
  });

  const response = await client.responses.parse({
    model: `gpt://${process.env.YANDEX_CLOUD_FOLDER}/${modelName}`,
    instructions: systemPrompt,
    input: prompt,
    temperature: 0,
    reasoning: {
      effort: "none",
    },
    text: {
      format: zodTextFormat(engineeringSchema, "EngineeringParser"),
    },
  });

  return {
    tokensUsage: response.usage ?? "No tokens usage metadata",
    parsed: response.output_parsed?.items as AiBatchParseResult[],
    responseText: response.output_text,
    modelName,
  };
};

const googleAiBatchParse = async (
  systemPrompt: string,
  prompt: string,
  targets: AIParseTarget[],
): Promise<AiBatchParseResultData> => {
  const modelName = "gemini-3.1-flash-lite-preview";
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
      required: ["sourceString", "rowId", "extracted"],
    },
  };

  const response = await ai.models.generateContent({
    model: modelName,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0,
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.MINIMAL,
      },
      systemInstruction: systemPrompt,
    },
  });

  return {
    parsed: JSON.parse(response.text || "") as AiBatchParseResult[],
    tokensUsage: response.usageMetadata ?? "No tokens usage metadata",
    responseText: response.text ?? "No response text",
    modelName,
  };
};

const yandexAiSingleParse = async (
  systemPrompt: string,
  prompt: string,
  targets: AIParseTarget[],
): Promise<AiSingleParseResultData> => {
  // const modelName = "qwen3.5-35b-a3b-fp8/latest";
  const modelName = "aliceai-llm/latest";

  const client = new OpenAI({
    apiKey: process.env.YANDEX_CLOUD_API_KEY,
    baseURL: "https://ai.api.cloud.yandex.net/v1",
    defaultHeaders: {
      "OpenAI-Project": process.env.YANDEX_CLOUD_FOLDER,
    },
  });

  const schema = z.object(
    targets.reduce(
      (acc, t) => {
        acc[t.key] = z.string().nullable().describe(t.label);
        return acc;
      },
      {} as Record<string, z.ZodTypeAny>,
    ),
  );

  const response = await client.responses.parse({
    model: `gpt://${process.env.YANDEX_CLOUD_FOLDER}/${modelName}`,
    instructions: systemPrompt,
    input: prompt,
    temperature: 0,
    reasoning: {
      effort: "none",
    },
    text: {
      format: zodTextFormat(schema, "EngineeringParser"),
    },
  });

  return {
    tokensUsage: response.usage ?? "No tokens usage metadata",
    parsed: response.output_parsed as AiSingleParseResult,
    responseText: response.output_text,
    modelName,
  };
};
