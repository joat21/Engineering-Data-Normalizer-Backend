import { FieldContext, type SystemFieldMetadata } from "./types";
import { DataType } from "../category";

export const SYSTEM_FIELDS_CONFIG = {
  name: { label: "Название", type: DataType.STRING },
  manufacturerName: {
    label: "Производитель",
    type: DataType.STRING,
    excludeContexts: [FieldContext.IMPORT],
  },
  supplierName: {
    label: "Поставщик",
    type: DataType.STRING,
    excludeContexts: [FieldContext.IMPORT],
  },
  article: { label: "Артикул", type: DataType.STRING },
  model: { label: "Модель", type: DataType.STRING },
  externalCode: { label: "Код", type: DataType.STRING },
  price: {
    label: "Цена (ориг.)",
    type: DataType.NUMBER,
    contexts: [FieldContext.IMPORT, FieldContext.AI],
    excludeContexts: [FieldContext.FTS],
  },
  priceInRub: {
    label: "Цена",
    type: DataType.NUMBER,
    unit: "₽",
    contexts: [FieldContext.FILTERS, FieldContext.COMPARISON],
    excludeContexts: [FieldContext.FTS],
  },
} as const satisfies Record<string, SystemFieldMetadata>;

export const SYSTEM_FIELD_KEYS = Object.keys(SYSTEM_FIELDS_CONFIG) as Array<
  keyof typeof SYSTEM_FIELDS_CONFIG
>;
