import {
  DataType,
  EnrichedTarget,
  MappingTargetType,
  NormalizationIssue,
} from "@engineering-data-normalizer/shared";
import { booleanNormalizationOptions } from "./config";
import { getTargetKey } from "../../helpers/getTargetKey";
import { getAttributeOptionsMap } from "../../helpers/getAttributeOptionsMap";

export const enrichIssuesWithOptions = async (
  issues: { target: EnrichedTarget; unnormalizedValues: string[] }[],
): Promise<NormalizationIssue[]> => {
  const stringAttrKeys = issues
    .filter((v) => v.target.type === MappingTargetType.ATTRIBUTE)
    .map((v) => getTargetKey(v.target));

  const optionsMap = await getAttributeOptionsMap(stringAttrKeys);

  return issues.map((issue) => {
    const key = getTargetKey(issue.target);
    let options = optionsMap.get(key) || [];

    // Если это булево, добавляем стандартные Да/Нет
    if (issue.target.dataType === DataType.BOOLEAN && options.length === 0) {
      options = booleanNormalizationOptions;
    }

    return {
      ...issue,
      normalizationOptions: options,
    };
  });
};
