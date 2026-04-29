import { Button, Modal } from "@heroui/react";
import { AppModal, type AppModalProps } from "@/shared/ui";

interface ConfirmRowsDeletionModal extends AppModalProps {
  rowsCount: number;
  onDeleteRows: () => void;
  isPending: boolean;
}

export const ConfirmRowsDeletionModal = ({
  state,
  onDeleteRows,
  rowsCount,
  isPending,
  ...props
}: ConfirmRowsDeletionModal) => {
  return (
    <AppModal state={state} {...props}>
      <Modal.Dialog>
        <Modal.CloseTrigger />
        <Modal.Header>
          <Modal.Heading className="text-xl">
            Подтвердите действие
          </Modal.Heading>
        </Modal.Header>
        <Modal.Body>
          <p className="text-base">
            Вы уверены, что хотите удалить {rowsCount} строк? Это действие
            нельзя будет отменить
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button onPress={state.close} variant="outline">
            Отмена
          </Button>
          <Button
            variant="danger-soft"
            onPress={onDeleteRows}
            isDisabled={isPending}
          >
            Подтвердить
          </Button>
        </Modal.Footer>
      </Modal.Dialog>
    </AppModal>
  );
};
