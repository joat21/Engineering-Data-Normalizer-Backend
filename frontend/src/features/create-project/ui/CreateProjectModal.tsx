import { useState } from "react";
import { Button, Input, Label, Modal, TextArea, toast } from "@heroui/react";
import { useCreateProjectMutation } from "../api/create-project.api";

interface CreateProjectModalProps {
  onClose: () => void;
  isOpen: boolean;
}

export const CreateProjectModal = ({
  onClose,
  isOpen,
}: CreateProjectModalProps) => {
  const [name, setName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);

  const createProjectMutation = useCreateProjectMutation();

  const handleCreateProject = async () => {
    if (!name || !description) {
      return toast.danger("Заполните обязательные поля");
    }

    await createProjectMutation.mutateAsync({ name, description });
    onClose();
  };

  return (
    <Modal.Backdrop isOpen={isOpen}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.CloseTrigger onPress={onClose} />
          <Modal.Header>
            <Modal.Heading className="text-xl">Создание проекта</Modal.Heading>
          </Modal.Header>
          <Modal.Body className="flex flex-col gap-3">
            <Label className="flex flex-col gap-1 text-lg">
              Название
              <Input
                placeholder="Введите название..."
                onChange={(e) => setName(e.target.value)}
                variant="secondary"
                required
              />
            </Label>
            <Label className="flex flex-col gap-1 text-lg">
              Описание
              <TextArea
                placeholder="Введите описание..."
                onChange={(e) => setDescription(e.target.value)}
                variant="secondary"
                required
              />
            </Label>
          </Modal.Body>
          <Modal.Footer>
            <Button onPress={onClose} variant="secondary">
              Отмена
            </Button>
            <Button
              onPress={handleCreateProject}
              isDisabled={createProjectMutation.isPending}
            >
              Создать
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
