import { z } from "zod";
import {
  deleteStagingItemsSchema,
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
  unit?: string | null;
  originIndex: number;
  subIndex?: number;
};

export type StagingRow = {
  id: string;
  rowIndex: number;
  values: Record<string, string>;
};

export type StagingTable = {
  columns: StagingColumn[];
  rows: StagingRow[];
};

export type InitImportBody = z.infer<typeof initImportSchema.shape.body>;

export type ImportRowsParams = z.infer<typeof importRowsSchema.shape.params>;
export type ImportRowsBody = z.infer<typeof importRowsSchema.shape.body>;

export type GetStagingTableParams = z.infer<
  typeof getStagingTableSchema.shape.params
>;

export type DeleteStagingItemsBody = z.infer<
  typeof deleteStagingItemsSchema.shape.body
>;
