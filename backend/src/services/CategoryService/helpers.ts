import {
  MappingTargetType,
  SystemFieldsConfig,
} from "@engineering-data-normalizer/shared";

export const transformSystemFieldsToAttributes = (
  fieldsConfig: Partial<SystemFieldsConfig>,
) => {
  return Object.entries(fieldsConfig).map(([key, config]) => {
    return {
      id: key,
      key: key,
      type: MappingTargetType.SYSTEM,
      label: config.label,
      unit: config.unit,
      dataType: config.type,
      isFilterable: true,
      options: [],
    };
  });
};
