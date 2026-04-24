import { useCallback, useEffect, useMemo, useState } from "react";
import { useOverlayState } from "@heroui/react";
import {
  getCoreRowModel,
  useReactTable,
  type ColumnOrderState,
  type ColumnPinningState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Settings2 } from "lucide-react";
import type { EquipmentRow } from "@engineering-data-normalizer/shared";
import { ColumnVisibility } from "./ColumnVisibility";
import { EquipmentTable } from "./EquipmentTable";
import { Filters } from "./Filters";
import { Pagination } from "./Pagination";
import { Search } from "./Search";
import { useEquipmentTableQuery } from "../model/useEquipmentTableQuery";
import { buildColumns } from "../model/buildColumns";
import { EquipmentDetailsDrawer } from "@/widgets/EquipmentDetailsDrawer";
import { AddToProjectModal } from "@/features/add-to-project";
import { useCategories } from "@/entities/category";
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

  const { data: categories } = useCategories();
  const categoryName = categories?.find((c) => c.id === categoryId)?.name;
  const { query, updateQuery } = useEquipmentTableQuery();

  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(
    null,
  );
  const [equipmentDetailsId, setEquipmentDetailsId] = useState<string | null>(
    query.details ?? null,
  );

  const { data: equipmentData, isPending: isEquipmentPending } =
    useEquipmentTable(query);
  const { data: categoryFilters, isPending: isFiltersPending } =
    useCategoryFilters(categoryId);

  const handleSearch = (value: string | undefined) => {
    updateQuery({
      ...query,
      search: value,
      page: 1,
    });
  };

  const handleClearSearch = () => {
    updateQuery({
      ...query,
      search: undefined,
      page: 1,
    });
  };

  const addToComparisonMutation = useAddToComparisonMutation();

  const handleViewDetails = useCallback(
    (equipmentId: string) => {
      setEquipmentDetailsId(equipmentId);
      updateQuery({
        ...query,
        details: equipmentId,
      });
      equipmentDetailsDrawer.open();
    },
    [equipmentDetailsDrawer.open, updateQuery],
  );

  const handleCloseDetails = useCallback(() => {
    updateQuery({
      ...query,
      details: undefined,
    });
    setEquipmentDetailsId(null);
    equipmentDetailsDrawer.close();
  }, [equipmentDetailsDrawer.close, updateQuery]);

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
          <div className="flex items-center gap-3 px-1">
            <h1 className="text-2xl font-semibold">{categoryName}</h1>
            <span> |</span>
            <span className="mt-1 text-lg">
              Позиций: {equipmentData.pagination.total}
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 rounded-2xl border bg-white ">
            <Search
              searchText={query.search}
              onSearch={handleSearch}
              onClear={handleClearSearch}
            />

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
        state={addToProjectModal}
      />

      <EquipmentDetailsDrawer
        equipmentId={equipmentDetailsId}
        isOpen={equipmentDetailsDrawer.isOpen || equipmentDetailsId !== null}
        onClose={handleCloseDetails}
        onAddToProject={handleAddToProject}
        onCompare={handleAddToComparison}
      />
    </>
  );
};
