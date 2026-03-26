import { z } from "zod";
import {
  booleanFilterValueSchema,
  filterValueSchema,
  numericFilterValueSchema,
  stringFilterValueSchema,
  createEquipmentSchema,
  createEquipmentFromStagingSchema,
} from "./schemas";

export type CreateEquipmentBody = z.infer<
  typeof createEquipmentSchema.shape.body
>;

export type CreateEquipmentFromStagingQuery = z.infer<
  typeof createEquipmentFromStagingSchema.shape.query
>;

export type NumericFilterValue = z.infer<typeof numericFilterValueSchema>;
export type StringFilterValue = z.infer<typeof stringFilterValueSchema>;
export type BooleanFilterValue = z.infer<typeof booleanFilterValueSchema>;
export type FilterValue = z.infer<typeof filterValueSchema>;
