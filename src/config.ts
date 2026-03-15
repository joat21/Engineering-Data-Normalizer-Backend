import {
  ImportStatus,
  DataType as PrismaDataType,
  MappingTargetType,
} from "./generated/prisma/client";
import { EquipmentSystemFields } from "./types";

export const DATA_TYPE = PrismaDataType;

export const TRANSFORM_TYPE = {
  EXTRACT_NUMBERS: "EXTRACT_NUMBERS",
  SPLIT_BY: "SPLIT_BY",
  MULTIPLY: "MULTIPLY",
} as const;

export const TARGET_TYPE = MappingTargetType;

export const SYSTEM_FIELDS_CONFIG = {
  name: { label: "Название", type: "STRING" },
  manufacturer: { label: "Производитель", type: "STRING" },
  article: { label: "Артикул", type: "STRING" },
  model: { label: "Модель", type: "STRING" },
  externalCode: { label: "Код", type: "STRING" },
  price: { label: "Цена", type: "NUMBER" },
} as const satisfies Record<
  keyof EquipmentSystemFields,
  { label: string; type: string }
>;

export const SYSTEM_FIELD_KEYS = Object.keys(SYSTEM_FIELDS_CONFIG) as Array<
  keyof typeof SYSTEM_FIELDS_CONFIG
>;

export const SYSTEM_FIELDS = Object.fromEntries(
  SYSTEM_FIELD_KEYS.map((key) => [key.toUpperCase(), key]),
) as { [K in keyof typeof SYSTEM_FIELDS_CONFIG as Uppercase<K>]: K };

export const IMPORT_SESSION_STATUS = ImportStatus;
