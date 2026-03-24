import { z } from "zod";
import {
  getStagingTableSchema,
  importRowsSchema,
  initImportSchema,
} from "./schemas";

export const SourceType = {
  CATALOG: "CATALOG",
  SINGLE_ITEM: "SINGLE_ITEM",
} as const;

export type SourceType = (typeof SourceType)[keyof typeof SourceType];

export type StagingColumn = {
  id: string;
  label: string;
  originIndex: number;
  subIndex?: number;
};

export type StagingRow = {
  id: string;
  rowIndex: number;
  values: Record<string, string>;
};

export type InitImportBody = z.infer<typeof initImportSchema.shape.body>;

export type ImportRowsParams = z.infer<typeof importRowsSchema.shape.params>;
export type ImportRowsBody = z.infer<typeof importRowsSchema.shape.body>;

export type GetStagingTableParams = z.infer<
  typeof getStagingTableSchema.shape.params
>;
