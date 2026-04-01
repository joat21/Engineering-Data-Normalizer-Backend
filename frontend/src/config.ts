import { DataType } from "@engineering-data-normalizer/shared";

export const qsOptions: qs.IStringifyOptions<qs.BooleanOptional> = {
  arrayFormat: "brackets",
  encode: false,
  skipNulls: true,
};

export const DATA_TYPE_LABELS = {
  [DataType.STRING]: "Строковый",
  [DataType.NUMBER]: "Числовой",
  [DataType.BOOLEAN]: "Логический",
};
