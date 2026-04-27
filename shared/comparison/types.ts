import z from "zod";
import { addToComparisonSchema, removeFromComparisonSchema } from "./schemas";

export type AddToComparisonBody = z.infer<
  typeof addToComparisonSchema.shape.body
>;

export type RemoveFromComparisonParams = z.infer<
  typeof removeFromComparisonSchema.shape.params
>;

export interface ComparisonField {
  key: string;
  label: string;
  unit?: string | null;
}

export interface ComparisonItem {
  id: string;
  equipmentId: string;
  values: Record<string, string>;
}

export interface ComparisonCategory {
  categoryId: string;
  categoryName: string;
  fields: ComparisonField[];
  items: ComparisonItem[];
}
