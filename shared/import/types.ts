import { z } from "zod";
import { importRowsSchema, initImportSchema } from "./schemas";

export const SourceType = {
  CATALOG: "CATALOG",
  SINGLE_ITEM: "SINGLE_ITEM",
} as const;

export type SourceType = (typeof SourceType)[keyof typeof SourceType];

export type InitImportBody = z.infer<typeof initImportSchema.shape.body>;

export type ImportRowsParams = z.infer<typeof importRowsSchema.shape.params>;
export type ImportRowsBody = z.infer<typeof importRowsSchema.shape.body>;
