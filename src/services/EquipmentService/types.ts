import z from "zod";
import { Equipment } from "../../generated/prisma/client";
import {
  booleanFilterValueSchema,
  filterValueSchema,
  numericFilterValueSchema,
  stringFilterValueSchema,
} from "../../schemas/equipment";

export type SystemEquipmentFields = Pick<
  Equipment,
  "name" | "manufacturer" | "article" | "model" | "externalCode" | "price"
>;

export type NumericFilterValue = z.infer<typeof numericFilterValueSchema>;
export type StringFilterValue = z.infer<typeof stringFilterValueSchema>;
export type BooleanFilterValue = z.infer<typeof booleanFilterValueSchema>;
export type FilterValue = z.infer<typeof filterValueSchema>;
