import { StagingColumn } from "@engineering-data-normalizer/shared";

export const isSubColumn = (
  col: StagingColumn,
): col is StagingColumn & { subIndex: number } => {
  return "subIndex" in col && col.subIndex !== undefined;
};
