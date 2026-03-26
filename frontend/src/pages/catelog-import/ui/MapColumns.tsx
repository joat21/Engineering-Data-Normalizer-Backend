import { Button, Spinner } from "@heroui/react";
import { RowsSelectionPanel } from "./RowsSelectionPanel";
import { TableBody } from "./TableBody";
import { TableHeader } from "./TableHeader";
import { TransformModalManager } from "./TransformModalManager";
import {
  useCreateEquipmentFromStagingMutation,
  useStagingTable,
} from "@/features/import";
import { useCategoryAttributes } from "@/entities/category-attribute";
import { ResolveNormalizationIssuesModal } from "./ResolveNormalizationIssuesModal";

interface MapColumnsProps {
  sessionId: string;
}

export const MapColumns = ({ sessionId }: MapColumnsProps) => {
  const createEquipmentFromStagingMutation =
    useCreateEquipmentFromStagingMutation();

  const { data: table, isPending: isTablePending } = useStagingTable({
    sessionId,
  });

  const { data: attributes, isPending: isAttributesPending } =
    useCategoryAttributes("84eb045d-ca69-4446-9d2f-8f8184c72180");

  if (isTablePending || isAttributesPending) return <Spinner />;
  if (!table || !attributes) return "Произошла ошибка";

  const handleSave = () => {
    createEquipmentFromStagingMutation.mutate(
      { sessionId },
      { onSuccess: () => alert("Оборудование сохранено") },
    );
  };

  return (
    <>
      <div className="flex flex-col gap-2 pt-4">
        <Button onPress={handleSave}>Сохранить оборудование</Button>
        <table>
          <TableHeader
            columns={table.columns}
            attributes={attributes}
            isAttributesPending={isAttributesPending}
            sessionId={sessionId}
          />
          <TableBody table={table} />
        </table>
      </div>

      <RowsSelectionPanel />

      <ResolveNormalizationIssuesModal />

      <TransformModalManager
        attributes={attributes}
        rows={table.rows}
        sessionId={sessionId}
      />
    </>
  );
};
