import { DataType } from "@engineering-data-normalizer/shared";
import { DATA_TYPE_LABELS } from "@/config";

export const DATA_TYPE_OPTIONS = [
  { key: DataType.STRING, label: DATA_TYPE_LABELS[DataType.STRING] },
  { key: DataType.NUMBER, label: DATA_TYPE_LABELS[DataType.NUMBER] },
  { key: DataType.BOOLEAN, label: DATA_TYPE_LABELS[DataType.BOOLEAN] },
];
