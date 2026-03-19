import { enrichIssuesWithOptions } from "../helpers";
import { MappingTarget } from "../types";
import { buildTransformedRows, saveTransformedRows } from "./builders";

export const executeUpdatePipeline = async (params: {
  items: any[];
  colIndex: number;
  targets: (MappingTarget | null)[];
  updatedValuesByItem: Map<string, string[]>;
  rawValueByItem: Map<string, string>;
}) => {
  const { items, colIndex, targets, updatedValuesByItem, rawValueByItem } =
    params;

  const { transformedRows, issues: rawIssues } = await buildTransformedRows({
    items,
    colIndex,
    updatedValuesByItem,
    rawValueByItem,
    targets,
  });

  if (transformedRows.length === 0) {
    return { count: 0, issues: [] };
  }

  const issues = await enrichIssuesWithOptions(rawIssues);

  await saveTransformedRows(transformedRows);

  return {
    count: transformedRows.length,
    issues,
  };
};
