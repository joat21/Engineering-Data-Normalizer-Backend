import { useState } from "react";
import { Button, Modal } from "@heroui/react";
import { useAddToProjectMutation } from "../api/add-to-project.api";
import { useProjects } from "@/entities/project";
import { AppSelect } from "@/shared/ui";

interface AddToProjectModalProps {
  selectedEquipmentId: string | null;
  onClose: () => void;
  isOpen: boolean;
}

export const AddToProjectModal = ({
  selectedEquipmentId,
  onClose,
  isOpen,
}: AddToProjectModalProps) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );

  const addToProjectMutation = useAddToProjectMutation();
  const { data: projects } = useProjects();

  const handleAddToProject = () => {
    if (!selectedEquipmentId || !selectedProjectId) return;

    addToProjectMutation.mutate({
      equipmentId: selectedEquipmentId,
      projectId: selectedProjectId,
      amount: 1,
    });
    onClose();
  };

  return (
    <Modal.Backdrop isOpen={isOpen}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.CloseTrigger onPress={onClose} />
          <Modal.Header>
            <Modal.Heading>Выберите проект</Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <AppSelect
              items={projects ?? []}
              getItemKey={(p) => p.id}
              getItemLabel={(p) => p.name}
              aria-label="Проекты"
              variant="secondary"
              onChange={(value) => setSelectedProjectId(String(value ?? ""))}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button onPress={onClose} variant="secondary">
              Отмена
            </Button>
            <Button onPress={handleAddToProject}>Подтвердить</Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
