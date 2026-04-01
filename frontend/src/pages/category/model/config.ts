import { DataType } from "@engineering-data-normalizer/shared";

export const HEADERS = [
  "НАЗВАНИЕ",
  "ТИП",
  "ЕДИНИЦА ИЗМЕРЕНИЯ",
  "ФИЛЬТР",
  "ДЕЙСТВИЯ",
];

export const DATA_TYPE_CHIP_COLORS = {
  [DataType.STRING]: "bg-green-300",
  [DataType.NUMBER]: "bg-blue-300",
  [DataType.BOOLEAN]: "bg-purple-300",
};
