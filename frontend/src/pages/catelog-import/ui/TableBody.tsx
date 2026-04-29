import { useMemo } from "react";
import type { StagingTable } from "@engineering-data-normalizer/shared";
import { DataRow } from "./DataRow";
import { useSelectionStore } from "../model/store";

interface TableBodyProps {
  table: StagingTable;
}

export const TableBody = ({ table }: TableBodyProps) => {
  const { columns, rows } = table;

  const isSelecting = useSelectionStore((s) => s.isSelecting);

  const columnKeys = useMemo(() => columns.map((c) => c.id), [columns]);

  return (
    <tbody>
      {rows.map((row) => (
        <DataRow
          key={row.id}
          row={row}
          columnKeys={columnKeys}
          isSelecting={isSelecting}
        />
      ))}
    </tbody>
  );
};
