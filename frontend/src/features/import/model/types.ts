import type {
  StagingColumn,
  StagingRow,
} from "@engineering-data-normalizer/shared";

export const SingleImportStep = {
  TYPE_SELECTION: "TYPE_SELECTION",
  FILL_ATTRIBUTES: "FILL_ATTRIBUTES",
  SUCCESS: "SUCCESS",
} as const;

export type SingleImportStep =
  (typeof SingleImportStep)[keyof typeof SingleImportStep];

export const CatalogImportStep = {
  TYPE_SELECTION: "TYPE_SELECTION",
  INIT_TABLE: "INIT_TABLE",
  MAP_COLUMNS: "MAP_COLUMNS",
  SUCCESS: "SUCCESS",
};

export type CatalogImportStep =
  (typeof CatalogImportStep)[keyof typeof CatalogImportStep];

export type StagingTable = {
  columns: StagingColumn[];
  rows: StagingRow[];
};
