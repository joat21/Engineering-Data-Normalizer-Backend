import { Button, Card, cn } from "@heroui/react";
import { useSelectionStore } from "../model/store";

interface DeleteRowsSelectionPanelProps {
  onContinue: () => void;
}

export const DeleteRowsSelectionPanel = ({
  onContinue,
}: DeleteRowsSelectionPanelProps) => {
  const isSelecting = useSelectionStore((s) => s.activeContext === "delete");
  const setSelectionContext = useSelectionStore((s) => s.setContext);
  const count = useSelectionStore((s) => s.count);

  if (!isSelecting) return null;

  const handleCancel = () => {
    setSelectionContext(null);
  };

  return (
    <Card
      className={cn(
        "fixed bottom-12 left-1/2 flex-row gap-6 items-center px-6 py-3 max-w-[90vh] w-fit",
        "border-2 border-danger backdrop-blur-xl ring-1 ring-accent/10 -translate-x-1/2 shadow-2xl",
      )}
    >
      <div className="flex flex-col">
        <span className="text-lg font-semibold">Удаление строк</span>
        <span>Выберите строки, которые хотите удалить</span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onPress={handleCancel}
          className="font-medium"
          variant="outline"
        >
          Отмена
        </Button>
        <Button
          isDisabled={count === 0}
          onPress={onContinue}
          className="font-bold px-6"
          variant="danger"
        >
          Подтвердить удаление
        </Button>
      </div>
    </Card>
  );
};
