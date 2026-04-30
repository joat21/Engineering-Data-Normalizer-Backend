import { useNavigate } from "react-router";
import { Button, useOverlayState } from "@heroui/react";
import { Plus, Save, Trash } from "lucide-react";
import { ResolveNormalizationIssuesModal } from "./ResolveNormalizationIssuesModal";
import { AiParseRowsSelectionPanel } from "./AiParseRowsSelectionPanel";
import { DeleteRowsSelectionPanel } from "./DeleteRowsSelectionPanel";
import { TableBody } from "./TableBody";
import { TableHeader } from "./TableHeader";
import { TransformModalManager } from "./TransformModalManager";
import { ConfirmRowsDeletionModal } from "./ConfirmRowsDeletionModal";
import { useSelectionStore } from "../model/store";
import {
  CatalogImportStep,
  useCreateEquipmentFromStagingMutation,
  useImportStore,
  useStagingTable,
} from "@/features/import";
import { useAttributesForImport } from "@/entities/category-attribute";
import { CreateCategoryAttributeModal } from "@/features/create-category-attibute";
import { useDeleteStagingItemsMutation } from "@/features/delete-staging-items";
import { PageLoader, ImportSuccessModal } from "@/shared/ui";
import { ConfirmResetColumnModal } from "@/features/reset-column";
import { useState } from "react";
import type { StagingColumn } from "@engineering-data-normalizer/shared";

interface MapColumnsProps {
  sessionId: string;
  categoryId: string;
}

export const MapColumns = ({ sessionId, categoryId }: MapColumnsProps) => {
  const navigate = useNavigate();
  const successModal = useOverlayState();
  const confirmRowsDeletionModal = useOverlayState();
  const confirmResetColumnModal = useOverlayState();
  const createCategoryAttributeModal = useOverlayState();

  const categoryName = useImportStore((s) => s.categoryName);
  const resetImport = useImportStore((s) => s.reset);
  const setStep = useImportStore((s) => s.setStep);

  const selectedRowIds = useSelectionStore((s) => s.selectedRowIds);
  const count = useSelectionStore((s) => s.count);
  const setSelectionContext = useSelectionStore((s) => s.setContext);

  const [selectedCol, setSelectedCol] = useState<StagingColumn | null>(null);

  const createEquipmentFromStagingMutation =
    useCreateEquipmentFromStagingMutation();

  const deleteStagingItemsMutation = useDeleteStagingItemsMutation();

  const { data: table, isPending: isTablePending } = useStagingTable({
    sessionId,
  });

  const { data: attributes, isPending: isAttributesPending } =
    useAttributesForImport(sessionId);

  if (isTablePending || isAttributesPending) return <PageLoader />;
  if (!table || !attributes) return "Произошла ошибка";

  const handleSave = () => {
    createEquipmentFromStagingMutation.mutate(
      { sessionId },
      { onSuccess: () => successModal.open() },
    );
  };

  const handleFinish = () => {
    resetImport();
    successModal.close();
    navigate("/");
  };

  const handleAddMore = () => {
    successModal.close();
    setStep(CatalogImportStep.INIT_TABLE);
  };

  const handleDeletingRowsSelect = () => {
    setSelectionContext("delete");
  };

  const handleDeleteRows = () => {
    console.log(Object.keys(selectedRowIds));

    deleteStagingItemsMutation.mutate(
      { ids: Object.keys(selectedRowIds) },
      {
        onSuccess: () => {
          confirmRowsDeletionModal.close();
          setSelectionContext(null);
        },
      },
    );
  };

  const handleSelectColToReset = (col: StagingColumn) => {
    setSelectedCol(col);
    confirmResetColumnModal.open();
  };

  return (
    <>
      {/* h-[calc(100dvh-48px)] - здесь 48px = суммарный вертикальный паддинг обертки из MainLayout */}
      <div className="flex flex-col gap-6 w-full h-[calc(100dvh-48px)]">
        <div className="flex flex-row justify-between items-center px-1">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold">Маппинг характеристик</h1>
            <p>
              Свяжите колонки из файла с атрибутами категории и примените
              необходимые преобразования.
            </p>
            <div className="flex items-center gap-2 ">
              <span>
                Категория: <b>{categoryName}</b>
              </span>
              <span> |</span>
              <Button onPress={createCategoryAttributeModal.open} size="sm">
                <Plus size={16} />
                Добавить новый атрибут
              </Button>
              <span> |</span>
              <Button
                onPress={handleDeletingRowsSelect}
                variant="danger-soft"
                size="sm"
              >
                <Trash size={16} />
                Удалить строки
              </Button>
            </div>
          </div>

          <Button
            size="lg"
            className="font-bold px-8"
            onPress={handleSave}
            isPending={createEquipmentFromStagingMutation.isPending}
          >
            <Save />
            Сохранить оборудование
          </Button>
        </div>

        <div className="relative flex flex-col flex-1 rounded-xl overflow-hidden">
          <div className="flex-1 border border-b-0 rounded-br-none rounded-bl-none rounded-xl overflow-auto">
            <table className="w-full border-separate border-spacing-0">
              <TableHeader
                columns={table.columns}
                attributes={attributes}
                isAttributesPending={isAttributesPending}
                sessionId={sessionId}
                onSelectColToReset={handleSelectColToReset}
              />
              <TableBody table={table} />
            </table>
          </div>
        </div>
      </div>

      <AiParseRowsSelectionPanel />

      <DeleteRowsSelectionPanel onContinue={confirmRowsDeletionModal.open} />

      <ConfirmRowsDeletionModal
        state={confirmRowsDeletionModal}
        rowsCount={count}
        onDeleteRows={handleDeleteRows}
        isPending={deleteStagingItemsMutation.isPending}
      />

      <ConfirmResetColumnModal
        state={confirmResetColumnModal}
        sessionId={sessionId}
        col={selectedCol}
      />

      <ResolveNormalizationIssuesModal />

      <ImportSuccessModal
        isOpen={successModal.isOpen}
        onFinish={handleFinish}
        onAddMore={handleAddMore}
      />

      <TransformModalManager
        attributes={attributes}
        rows={table.rows}
        sessionId={sessionId}
      />

      <CreateCategoryAttributeModal
        categoryId={categoryId}
        state={createCategoryAttributeModal}
      />
    </>
  );
};
