import { useCallback, useEffect, useMemo, useState } from "react";
import { useOverlayState } from "@heroui/react";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnOrderState,
  type ColumnPinningState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Database, Settings2 } from "lucide-react";
import type { EquipmentRow } from "@engineering-data-normalizer/shared";
import { ColumnVisibility } from "./ColumnVisibility";
import { EquipmentTable } from "./EquipmentTable";
import { Pagination } from "./Pagination";
import { Filters } from "./Filters";
import { useEquipmentTableQuery } from "../model/useEquipmentTableQuery";
import { buildColumns } from "../model/buildColumns";
import { EquipmentDetailsDrawer } from "@/widgets/EquipmentDetailsDrawer";
import { AddToProjectModal } from "@/features/add-to-project";
import { useCategoryFilters } from "@/entities/category-filters";
import { useAddToComparisonMutation } from "@/entities/comparison";
import { useEquipmentTable } from "@/entities/equipment";
import { PageLoader } from "@/shared/ui";

interface EquipmentBrowseProps {
  categoryId: string;
}

export const EquipmentBrowse = ({ categoryId }: EquipmentBrowseProps) => {
  const addToProjectModal = useOverlayState();
  const equipmentDetailsDrawer = useOverlayState();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(
    null,
  );

  const { query } = useEquipmentTableQuery();

  const { data: equipmentData, isPending: isEquipmentPending } =
    useEquipmentTable(query);
  const { data: categoryFilters, isPending: isFiltersPending } =
    useCategoryFilters(categoryId);

  const addToComparisonMutation = useAddToComparisonMutation();

  const handleViewDetails = useCallback(
    (equipmentId: string) => {
      setSelectedEquipmentId(equipmentId);
      equipmentDetailsDrawer.open();
    },
    [equipmentDetailsDrawer.open],
  );

  const handleAddToProject = useCallback(
    (equipmentId: string) => {
      setSelectedEquipmentId(equipmentId);
      addToProjectModal.open();
    },
    [addToProjectModal.open],
  );

  const handleAddToComparison = useCallback(
    (equipmentId: string) => {
      addToComparisonMutation.mutate({ equipmentId });
    },
    [addToComparisonMutation.mutate],
  );

  const columns = useMemo(() => {
    if (!equipmentData?.headers) return [];
    return buildColumns(
      equipmentData.headers,
      handleViewDetails,
      handleAddToProject,
      handleAddToComparison,
    );
  }, [
    equipmentData?.headers,
    buildColumns,
    handleAddToProject,
    handleAddToComparison,
  ]);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>(
    columns.map((c) => c.id!),
  );
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>({
    left: [],
    right: ["actions"],
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

  if (isEquipmentPending || isFiltersPending) return <PageLoader />;
  if (!equipmentData) return "Произошла ошибка";

  return (
    <>
      <div className="relative flex gap-4 h-full items-start">
        <Filters filters={categoryFilters} />

        <div className="flex flex-col gap-4 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 rounded-2xl border bg-white ">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border">
                <Database size={20} className="text-primary" />
                <span className="font-semibold">
                  {equipmentData.pagination.total}
                  <span className="ml-1 font-normal text-sm uppercase">
                    позиций
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 mr-2 font-medium">
                <Settings2 />
                Вид таблицы:
              </div>

              <ColumnVisibility table={table} />
            </div>
          </div>
          <div className="flex flex-col gap-2 rounded-xl bg-white">
            <EquipmentTable table={table} />
            <Pagination pagination={equipmentData.pagination} />
          </div>
        </div>
      </div>

      <AddToProjectModal
        selectedEquipmentId={selectedEquipmentId}
        isOpen={addToProjectModal.isOpen}
        onClose={addToProjectModal.close}
      />

      <EquipmentDetailsDrawer
        equipmentId={selectedEquipmentId}
        isOpen={equipmentDetailsDrawer.isOpen}
        onClose={equipmentDetailsDrawer.close}
        onAddToProject={handleAddToProject}
        onCompare={handleAddToComparison}
      />
    </>
  );
};
