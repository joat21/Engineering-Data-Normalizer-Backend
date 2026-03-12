import { DataType } from "../../generated/prisma/enums";
import { SystemEquipmentFields } from "./types";

export const SYSTEM_FIELDS_CONFIG: Record<
  keyof SystemEquipmentFields,
  { label: string; type: DataType }
> = {
  name: { label: "Название", type: "STRING" },
  manufacturer: { label: "Производитель", type: "STRING" },
  article: { label: "Артикул", type: "STRING" },
  model: { label: "Модель", type: "STRING" },
  externalCode: { label: "Код", type: "STRING" },
  price: { label: "Цена", type: "NUMBER" },
};

export const FIELD_MAP: Record<string, string> = {
  STRING: "valueString",
  BOOLEAN: "valueBoolean",
};
