import { DataType } from "../category";

export const SYSTEM_FIELDS_CONFIG = {
  name: { label: "Название", type: DataType.STRING, unit: null },
  manufacturerName: {
    label: "Производитель",
    type: DataType.STRING,
    unit: null,
  },
  supplierName: { label: "Поставщик", type: DataType.STRING, unit: null },
  article: { label: "Артикул", type: DataType.STRING, unit: null },
  model: { label: "Модель", type: DataType.STRING, unit: null },
  externalCode: { label: "Код", type: DataType.STRING, unit: null },
  price: { label: "Цена", type: DataType.NUMBER, unit: "₽" },
} as const;

export const SYSTEM_FIELD_KEYS = Object.keys(SYSTEM_FIELDS_CONFIG) as Array<
  keyof typeof SYSTEM_FIELDS_CONFIG
>;
