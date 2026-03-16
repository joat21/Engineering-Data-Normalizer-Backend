import { DATA_TYPE, SYSTEM_FIELD_KEYS, SYSTEM_FIELDS } from "../../config";
import { Prisma } from "../../generated/prisma/client";
import { EquipmentSystemFields } from "../../types";
import {
  BooleanFilterValue,
  FilterValue,
  NumericFilterValue,
  StringFilterValue,
} from "./types";

export const getOperator = (type: string, value: FilterValue) => {
  if (value === undefined || value === null) return null;

  switch (type) {
    case DATA_TYPE.NUMBER: {
      const val = value as NumericFilterValue;
      const res: any = {};

      if (val.min !== undefined) res.gte = val.min;
      if (val.max !== undefined) res.lte = val.max;

      if (Array.isArray(val.options) && val.options.length > 0) {
        res.in = val.options.map(Number);
      }

      return Object.keys(res).length > 0 ? res : null;
    }

    case DATA_TYPE.STRING: {
      const val = value as StringFilterValue;
      if (!Array.isArray(val) || val.length === 0) return null;
      return { in: val };
    }

    case DATA_TYPE.BOOLEAN:
      const val = value as BooleanFilterValue;
      return { equals: val };

    default:
      return null;
  }
};

export const getOrderBy = (
  sortBy?: string,
): Prisma.EquipmentOrderByWithRelationInput => {
  if (!sortBy) {
    return { [SYSTEM_FIELDS.NAME]: "asc" };
  }

  const isDesc = sortBy.startsWith("-");
  const field = (
    isDesc ? sortBy.slice(1) : sortBy
  ) as keyof EquipmentSystemFields;

  if (!SYSTEM_FIELD_KEYS.includes(field)) {
    return { [SYSTEM_FIELDS.NAME]: "asc" };
  }

  return { [field]: isDesc ? "desc" : "asc" };
};
