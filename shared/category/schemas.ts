import z from "zod";
import { DataType } from "./types";

export const getCategoryFiltersSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});

export const getAttributesForImportSchema = z.object({
  params: z.object({
    importSessionId: z.uuid(),
  }),
});

export const getCategoryWithAttributesSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
});

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1),
  }),
});

export const createCategoryAttributeSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    label: z.string().min(1),
    unit: z.string().optional(),
    dataType: z.enum(DataType),
    isFilterable: z.boolean(),
  }),
});

export const updateCategoryAttributeSchema = z.object({
  params: z.object({
    id: z.uuid(),
  }),
  body: z.object({
    label: z.string().min(1).optional(),
    isFilterable: z.boolean().optional(),
  }),
});
