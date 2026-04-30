import { Button, Modal } from "@heroui/react";
import type { StagingColumn } from "@engineering-data-normalizer/shared";
import { useResetColumnMutation } from "../api/reset-column.api";
import { AppModal, type AppModalProps } from "@/shared/ui";
import { AlertTriangle } from "lucide-react";

interface ConfirmResetColumnModal extends AppModalProps {
  sessionId: string;
  col: StagingColumn | null;
}

export const ConfirmResetColumnModal = ({
  state,
  sessionId,
  col,
  ...props
}: ConfirmResetColumnModal) => {
  const resetColumnMutation = useResetColumnMutation();

  const handleReset = () => {
    if (col === null) return;

    resetColumnMutation.mutate(
      { sessionId, colIndex: col.originIndex },
      { onSuccess: () => state.close() },
    );
  };

  return (
    <AppModal state={state} {...props}>
      <Modal.Dialog>
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading className="text-xl">
            Подтвердите действие
          </Modal.Heading>
        </Modal.Header>
        <Modal.Body className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-base">
              Вы уверены, что хотите сбросить значения для колонки{" "}
              <strong>
                {col?.label}
                {col?.unit && ` (${col.unit})`}
              </strong>
              ?
            </p>
          </div>

          <blockquote className="p-3 border-l-4 border-warning bg-warning/10 text-sm">
            <h4 className="flex items-center gap-2 mb-2 text-sm font-bold">
              <AlertTriangle size={16} /> Что произойдет при сбросе:
            </h4>
            <ul className="pl-4 space-y-2 list-disc">
              <li>
                В таблицу вернется <strong>исходная колонка</strong> из Вашего
                файла.
              </li>
              <li>
                Если выбранная колонка была создана в результате преобразования
                — сброс приведет к <strong>удалению всей группы колонок</strong>
                , созданных в ходе преобразования исходной колонки.
              </li>
            </ul>
          </blockquote>

          <p className="text-danger text-base font-medium">
            Это действие нельзя будет отменить.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button onPress={state.close} variant="outline">
            Отмена
          </Button>
          <Button
            variant="danger-soft"
            onPress={handleReset}
            isDisabled={resetColumnMutation.isPending}
          >
            Подтвердить
          </Button>
        </Modal.Footer>
      </Modal.Dialog>
    </AppModal>
  );
};
