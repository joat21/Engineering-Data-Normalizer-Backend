import type {
  EquipmentHeader,
  EquipmentRow,
} from "@engineering-data-normalizer/shared";
import { Button } from "@heroui/react";
import type { ColumnDef } from "@tanstack/react-table";
import { BarChart2, Eye, Plus } from "lucide-react";

export const buildColumns = (
  headers: EquipmentHeader[],
  onViewDetails: (equipmentId: string) => void,
  onAddToProject: (equipmentId: string) => void,
  onCompare: (equipmentId: string) => void,
): ColumnDef<EquipmentRow, any>[] => {
  const dynamicColumns: ColumnDef<EquipmentRow, any>[] = headers.map(
    (header) => ({
      id: header.key,
      accessorKey: header.key,
      header: header.unit ? `${header.label} (${header.unit})` : header.label,
      cell: (info) => {
        const value = info.getValue();
        return value !== null && value !== undefined ? String(value) : "—";
      },
      size: 200,
    }),
  );

  const actionsColumn: ColumnDef<EquipmentRow, any> = {
    id: "actions",
    header: "Действия",
    size: 100,
    enableSorting: false,
    cell: (info) => {
      const equipment = info.row.original;

      return (
        <div className="flex gap-2 justify-center">
          <Button
            variant="ghost"
            isIconOnly
            onPress={() => onViewDetails(equipment.id)}
          >
            <Eye size={18} />
          </Button>
          <Button
            variant="ghost"
            isIconOnly
            onPress={() => onAddToProject(equipment.id)}
          >
            <Plus size={18} />
          </Button>
          <Button
            variant="ghost"
            isIconOnly
            onPress={() => onCompare(equipment.id)}
          >
            <BarChart2 size={18} />
          </Button>
        </div>
      );
    },
  };

  return [...dynamicColumns, actionsColumn];
};
