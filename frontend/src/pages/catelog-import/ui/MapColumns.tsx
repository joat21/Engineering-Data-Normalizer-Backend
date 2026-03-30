import { useNavigate } from "react-router";
import { Button, Spinner, useOverlayState } from "@heroui/react";
import { ImportSuccessModal } from "./ImportSuccessModal";
import { ResolveNormalizationIssuesModal } from "./ResolveNormalizationIssuesModal";
import { RowsSelectionPanel } from "./RowsSelectionPanel";
import { TableBody } from "./TableBody";
import { TableHeader } from "./TableHeader";
import { TransformModalManager } from "./TransformModalManager";
import {
  CatalogImportStep,
  useCreateEquipmentFromStagingMutation,
  useImportStore,
  useStagingTable,
} from "@/features/import";
import { useCategoryAttributes } from "@/entities/category-attribute";
import { Save } from "lucide-react";

interface MapColumnsProps {
  sessionId: string;
  categoryId: string;
}

export const MapColumns = ({ sessionId, categoryId }: MapColumnsProps) => {
  const navigate = useNavigate();
  const successModal = useOverlayState();

  const resetImport = useImportStore((s) => s.reset);
  const setStep = useImportStore((s) => s.setStep);

  const createEquipmentFromStagingMutation =
    useCreateEquipmentFromStagingMutation();

  const { data: table, isPending: isTablePending } = useStagingTable({
    sessionId,
  });

  const { data: attributes, isPending: isAttributesPending } =
    useCategoryAttributes(categoryId);

  if (isTablePending || isAttributesPending) return <Spinner />;
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

  return (
    <>
      {/* h-[calc(100dvh-48px)] - здесь 48px = суммарный вертикальный паддинг обертки из MainLayout */}
      <div className="flex flex-col gap-6 w-full h-[calc(100dvh-48px)]">
        <div className="flex flex-row justify-between items-center px-1">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">Маппинг характеристик</h1>
            <p>
              Свяжите колонки из файла с атрибутами категории и примените
              необходимые преобразования.
            </p>
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
              />
              <TableBody table={table} />
            </table>
          </div>
        </div>
      </div>

      <RowsSelectionPanel />

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
    </>
  );
};
