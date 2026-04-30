import {
  MappingTarget,
  NormalizedData,
  NormalizedValue,
  PrevActionType,
  TransformConfig,
} from "@engineering-data-normalizer/shared";
import { applyTransform } from "./transformation/transformers";
import { NormalizeSingleEntity, TransformedRow } from "./types";
import { prisma } from "../../prisma";
import { getRawValue } from "../../helpers/getRawValue";
import { buildSingleNormalizationContext } from "./normalization/context";
import { executeUpdatePipeline } from "./transformation/executeUpdatePipeline";
import { cleanValue } from "../../helpers/cleanValue";
import { getTargetKey } from "../../helpers/getTargetKey";
import { getAttributeInfoMap } from "../../db/categoryAttribute";
import { ApiError } from "../../exceptions/api-error";
import { aggregateNormalizedParts } from "../../helpers/aggregateNormalizedParts";

export const mapColumnToAttribute = async (params: {
  sessionId: string;
  colIndex: number;
  subIndex?: number;
  target: MappingTarget;
}) =>
  updateColumn({
    sessionId: params.sessionId,
    colIndex: params.colIndex,
    subIndex: params.subIndex,
    targets: [params.target],
    getUpdatedData: (rawValue) => [rawValue],
  });

export const applyColumnTransformation = async (params: {
  sessionId: string;
  colIndex: number;
  subIndex?: number;
  transform: TransformConfig;
  targets: (MappingTarget | null)[];
}) =>
  updateColumn({
    sessionId: params.sessionId,
    colIndex: params.colIndex,
    subIndex: params.subIndex,
    targets: params.targets,
    getUpdatedData: (rawValue) => applyTransform(rawValue, params.transform),
  });

const updateColumn = async (params: {
  sessionId: string;
  colIndex: number;
  subIndex?: number;
  targets: (MappingTarget | null)[];
  getUpdatedData: (rawValue: any) => any[];
}) => {
  const { sessionId, colIndex, subIndex, targets, getUpdatedData } = params;

  const items = await prisma.stagingImportItem.findMany({
    where: { sessionId },
    select: { id: true, rawRow: true, transformedRow: true },
  });

  if (!items.length) {
    throw ApiError.NotFound("Сессия импорта не найдена");
  }

  const updatedValuesByItem = new Map<string, string[]>();

  items.forEach((item) => {
    let rawValue = "";

    if (subIndex !== undefined) {
      const mappedCol = (item.transformedRow as TransformedRow)[colIndex];

      if (mappedCol[subIndex]) {
        rawValue = mappedCol[subIndex].normalized.valueString;
      }
    } else {
      rawValue = String(getRawValue(item.rawRow, colIndex) ?? "");
    }

    const updated = getUpdatedData(rawValue);

    updatedValuesByItem.set(
      item.id,
      updated.map((v) => String(v ?? "")),
    );
  });

  return executeUpdatePipeline({
    items,
    colIndex,
    subIndex,
    targets,
    updatedValuesByItem,
  });
};

export const commitAiParsingResults = async (params: {
  importSessionId: string;
  parsingSessionId: string;
  sourceColIndex: number;
  subIndex?: number;
  targets: MappingTarget[];
}) => {
  const {
    importSessionId,
    parsingSessionId,
    sourceColIndex,
    subIndex,
    targets,
  } = params;

  const aiRows = await prisma.aiParseResult.findMany({
    where: { sessionId: parsingSessionId },
  });

  if (!aiRows.length) {
    throw ApiError.NotFound("Сессия ИИ-анализа не найдена");
  }

  const items = await prisma.stagingImportItem.findMany({
    where: { sessionId: importSessionId },
    select: { id: true, transformedRow: true },
  });

  const grouped = new Map<string, Map<string, string>>();

  aiRows.forEach((r) => {
    if (!grouped.has(r.sourceItemId)) {
      grouped.set(r.sourceItemId, new Map());
    }

    grouped.get(r.sourceItemId)!.set(r.targetKey, r.rawValue ?? "");
  });

  const updatedValuesByItem = new Map<string, string[]>();

  // TODO: хотфикс путем получения key атрибута из БД,
  // надо сделать отдельный тип таргета, который будет содержать key
  // и являться MappingTarget одновременно (чтобы executeUpdatePipeline его схавал)
  const attributeInfoMap = await getAttributeInfoMap(targets);

  grouped.forEach((targetMap, itemId) => {
    const values = targets.map(
      (t) =>
        targetMap.get(attributeInfoMap.get(getTargetKey(t))?.key ?? "") ?? "",
    );
    updatedValuesByItem.set(itemId, values);
  });

  const result = await executeUpdatePipeline({
    items,
    colIndex: sourceColIndex,
    subIndex,
    targets,
    updatedValuesByItem,
  });

  if (!result.issues.length) {
    prisma.aiParseResult
      .deleteMany({ where: { sessionId: parsingSessionId } })
      .catch(console.error);
  }

  return result;
};

export const normalizeSingleImport = async (
  inputs: NormalizeSingleEntity[],
) => {
  if (!inputs.length) return [];

  const { values, cacheMap, mappingPlans } =
    await buildSingleNormalizationContext(inputs);

  const data = mappingPlans
    .map((plan, index) => {
      if (!plan) return null;

      const rawValue = values[index] ?? "";

      const normalized = plan.normalizer(rawValue, cacheMap);

      return {
        target: plan.target,
        rawValue,
        normalized: aggregateNormalizedParts(normalized, rawValue),
      };
    })
    .filter((r): r is NormalizedData => r !== null);

  return data;
};

export const resolveNormalizationIssues = async (params: {
  importSessionId: string;
  colIndex: number;
  targets: (MappingTarget | null)[];
  resolutions: {
    target: MappingTarget;
    rawValue: string;
    normalized: NormalizedValue;
  }[];
  prevActionType: PrevActionType;
  transform?: TransformConfig;
  parsingSessionId?: string;
}) => {
  const {
    importSessionId,
    colIndex,
    targets,
    resolutions,
    prevActionType,
    transform,
    parsingSessionId,
  } = params;

  const cacheData = resolutions.map((r) => ({
    attributeId:
      // TODO: нужно окончательно решить добавлять ли в кэш нормализации
      // системные поля или нет
      getTargetKey(r.target),
    rawValue: r.rawValue,
    cleanedValue: cleanValue(r.rawValue),
    normalized: r.normalized as any,
  }));

  await prisma.normalizationCache.createMany({
    data: cacheData,
    skipDuplicates: true,
  });

  if (prevActionType === PrevActionType.AI_PARSE && parsingSessionId) {
    return commitAiParsingResults({
      importSessionId,
      parsingSessionId,
      sourceColIndex: colIndex,
      targets: targets.filter((t) => t !== null),
    });
  }

  if (transform) {
    return applyColumnTransformation({
      sessionId: importSessionId,
      colIndex,
      transform,
      targets,
    });
  }

  const target = targets.find((t): t is MappingTarget => t !== null);
  if (!target) {
    throw ApiError.BadRequest(
      "Не указана цель маппинга для технического параметра",
    );
  }

  return mapColumnToAttribute({
    sessionId: importSessionId,
    colIndex,
    target,
  });
};

export const resetColumn = async (params: {
  sessionId: string;
  colIndex: number;
}) => {
  const { sessionId, colIndex } = params;

  await prisma.$executeRaw`
    UPDATE "StagingImportItem"
    SET "transformedRow" = "transformedRow" - ${colIndex.toString()}
    WHERE "sessionId" = ${sessionId}::uuid
  `;
};
