import { memo } from "react";
import { Checkbox } from "@heroui/react";
import type { StagingRow } from "@engineering-data-normalizer/shared";
import { useSelectionStore } from "../model/store";

interface DataRowProps {
  row: StagingRow;
  isSelecting: boolean;
  columnKeys: string[];
}

export const DataRow = memo(
  ({ row, isSelecting, columnKeys }: DataRowProps) => {
    const isSelected = useSelectionStore((s) => !!s.selectedRowIds[row.id]);
    const toggleRow = useSelectionStore((s) => s.toggleRow);

    return (
      <tr
        key={row.id}
        id={row.id}
        className="bg-white hover:bg-gray-100 transition-colors group"
      >
        {isSelecting && (
          <td className="p-3 border-b border-r text-center">
            <Checkbox
              aria-label={`Select`}
              slot="selection"
              variant="secondary"
              isSelected={isSelected}
              onChange={() => toggleRow(row.id)}
            >
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
            </Checkbox>
          </td>
        )}
        {columnKeys.map((key) => (
          <td
            key={key}
            className="p-3 border-b border-r max-w-75 text-center truncate"
          >
            {row.values[key] || "—"}
          </td>
        ))}
      </tr>
    );
  },
);
