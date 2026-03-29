import { Button, Modal } from "@heroui/react";

interface ImportSuccessModalProps {
  isOpen: boolean;
  onFinish: () => void;
  onAddMore: () => void;
}

export const ImportSuccessModal = ({
  isOpen,
  onFinish,
  onAddMore,
}: ImportSuccessModalProps) => {
  return (
    <Modal.Backdrop isOpen={isOpen}>
      <Modal.Container>
        <Modal.Dialog className="sm:max-w-90">
          <Modal.CloseTrigger onPress={onFinish} />
          <Modal.Header>
            <Modal.Heading>Импорт завершен</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <p>
              Импорт оборудования успешно завершен. Хотите добавить еще
              оборудование из этого файла?
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button onPress={onFinish} variant="secondary">
              Нет
            </Button>
            <Button onPress={onAddMore}>Да</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
