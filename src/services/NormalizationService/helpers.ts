import { JsonValue } from "@prisma/client/runtime/client";
import { isSimpleNumeric, normalizeValue } from "./normalizers";
import {
  AttributeTarget,
  MappingPlan,
  MappingTarget,
  TransformPayload,
} from "./types";
import { DataType } from "../../generated/prisma/enums";
import { prisma } from "../../../prisma/prisma";
import { DATA_TYPE, TARGET_TYPE } from "../../config";
import { getRawValue } from "../../helpers/getRawValue";

export const getTypeMap = async (targets: (MappingTarget | null)[]) => {
  const attrIds = targets
    .filter((t): t is AttributeTarget => t?.type === TARGET_TYPE.ATTRIBUTE)
    .map((t) => t.id);

  if (attrIds.length === 0) {
    return new Map<string, DataType>();
  }

  const attributes = await prisma.categoryAttribute.findMany({
    where: { id: { in: attrIds } },
    select: { id: true, dataType: true },
  });

  return new Map(attributes.map((a) => [a.id, a.dataType]));
};

export const getCacheMap = async (
  targets: (MappingTarget | null)[],
  items: {
    id: string;
    rawRow: JsonValue;
    transformedRow: JsonValue;
  }[],
  typeMap: Map<string, DataType>,
  colIndex: number,
  getUpdatedData: (rawValue: any) => any[],
) => {
  if (typeMap.size === 0) {
    return new Map<string, JsonValue>();
  }

  const cacheLookupSet = new Set<string>();

  items.forEach((item) => {
    const rawValue = getRawValue(item.rawRow, colIndex);
    const updatedData = getUpdatedData(rawValue);

    targets.forEach((target, i) => {
      if (!target || target.type !== TARGET_TYPE.ATTRIBUTE) return;

      const val = String(updatedData[i] ?? "")
        .toLowerCase()
        .trim();

      const attrType = typeMap.get(target.id);

      if (attrType !== DATA_TYPE.NUMBER) {
        cacheLookupSet.add(`${target.id}:${val}`);
      } else {
        const parts = val.split(/[\s]*[xх×][\s]*/).filter((p) => p.length > 0);
        parts.forEach((p) => {
          if (!isSimpleNumeric(p)) {
            cacheLookupSet.add(`${target.id}:${p.trim()}`);
          }
        });
      }
    });
  });

  const cacheEntries = await prisma.normalizationCache.findMany({
    where: {
      OR: Array.from(cacheLookupSet).map((pair) => {
        const [attrId, clean] = pair.split(":");
        return { attributeId: attrId, cleanedValue: clean };
      }),
    },
  });

  return new Map(
    cacheEntries.map((e) => [
      `${e.attributeId}:${e.cleanedValue}`,
      e.normalized,
    ]),
  );
};

export const getMappingPlans = (
  targets: (MappingTarget | null)[],
  typeMap: Map<string, DataType>,
): (MappingPlan | null)[] => {
  return targets.map((target) => {
    if (!target) return null;

    if (target.type === TARGET_TYPE.SYSTEM) {
      return {
        target,
        normalizer: (val: string) => ({ valueString: val }),
      };
    }

    return {
      target,
      normalizer: (val: string, cache: Map<string, JsonValue>) =>
        normalizeValue(
          val,
          typeMap.get(target.id) || DATA_TYPE.STRING,
          target.id,
          cache,
        ),
    };
  });
};
