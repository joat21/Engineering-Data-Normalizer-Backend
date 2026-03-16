import {
  ImportStatus,
  DataType as PrismaDataType,
  MappingTargetType,
  ImportItemStatus,
} from "./generated/prisma/client";
import { DataType, EquipmentSystemFields } from "./types";

export const DATA_TYPE = PrismaDataType;

export const TRANSFORM_TYPE = {
  EXTRACT_NUMBERS: "EXTRACT_NUMBERS",
  SPLIT_BY: "SPLIT_BY",
  MULTIPLY: "MULTIPLY",
} as const;

export const TARGET_TYPE = MappingTargetType;

export const SYSTEM_FIELDS_CONFIG = {
  name: { label: "Название", type: DATA_TYPE.STRING },
  manufacturer: { label: "Производитель", type: DATA_TYPE.STRING },
  article: { label: "Артикул", type: DATA_TYPE.STRING },
  model: { label: "Модель", type: DATA_TYPE.STRING },
  externalCode: { label: "Код", type: DATA_TYPE.STRING },
  price: { label: "Цена", type: DATA_TYPE.NUMBER },
} as const satisfies Record<
  keyof EquipmentSystemFields,
  { label: string; type: DataType }
>;

export const SYSTEM_FIELD_KEYS = Object.keys(SYSTEM_FIELDS_CONFIG) as Array<
  keyof typeof SYSTEM_FIELDS_CONFIG
>;

export const SYSTEM_FIELDS = Object.fromEntries(
  SYSTEM_FIELD_KEYS.map((key) => [key.toUpperCase(), key]),
) as { [K in keyof typeof SYSTEM_FIELDS_CONFIG as Uppercase<K>]: K };

export const IMPORT_SESSION_STATUS = ImportStatus;

export const STAGING_IMPORT_ITEM_STATUS = ImportItemStatus;
