import { useEffect, useMemo, useState } from "react";
import { Spinner } from "@heroui/react";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnOrderState,
  type ColumnPinningState,
  type VisibilityState,
} from "@tanstack/react-table";
import { ColumnVisibility } from "./ColumnVisibility";
import { EquipmentTable } from "./EquipmentTable";
import { buildColumns } from "../model/utils";
import { useEquipmentTable } from "@/entities/equipment";
import type { EquipmentRow } from "@engineering-data-normalizer/shared";

interface EquipmentBrowseProps {
  categoryId: string;
}

export const EquipmentBrowse = ({ categoryId }: EquipmentBrowseProps) => {
  const { data: equipmentData, isPending } = useEquipmentTable(categoryId);

  const columns = useMemo(() => {
    if (!equipmentData?.headers) return [];
    return buildColumns(equipmentData.headers);
  }, [equipmentData?.headers]);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
    columns.map((c) => c.id!),
  );
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: [],
    right: [],
  });

  useEffect(() => {
    if (columns.length > 0 && columnOrder.length === 0) {
      setColumnOrder(columns.map((c) => c.id!));
    }
  }, [columns]);

  const table = useReactTable<EquipmentRow>({
    columns,
    data: equipmentData?.rows ?? [],
    state: {
      columnVisibility,
      columnOrder,
      columnPinning,
    },
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
  });

  if (isPending) return <Spinner />;
  if (!equipmentData) return "Произошла ошибка";

  return (
    <div className="flex gap-4 h-full items-start">
      <aside className="w-72 shrink-0 sticky top-0">
        <div className="p-4 bg-white rounded-2xl border border-default-200 shadow-sm">
          <h3 className="font-semibold mb-4 text-default-700">Фильтры</h3>
          <div className="flex flex-col gap-4">
            <span>фильтры</span>
          </div>
        </div>
      </aside>
      <div className="flex flex-col flex-1 gap-4  min-w-0">
        <div className="flex justify-between items-center bg-white p-3 rounded-2xl border border-default-200">
          <div className="text-sm text-default-500">
            Найдено позиций: {equipmentData.pagination.total}
          </div>
          <ColumnVisibility table={table} />
        </div>
        <EquipmentTable table={table} />
      </div>
    </div>
  );
};
