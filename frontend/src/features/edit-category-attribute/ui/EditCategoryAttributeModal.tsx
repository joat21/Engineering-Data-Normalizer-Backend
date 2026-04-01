import { Button, Checkbox, Form, Input, Label, Modal } from "@heroui/react";
import { type CategoryAttribute } from "@engineering-data-normalizer/shared";
import { useEditCategoryAttributeMutation } from "../api/edit-category-attribute.api";

interface EditCategoryAttributeModalProps {
  attribute: CategoryAttribute | undefined;
  onClose: () => void;
  isOpen: boolean;
}

export const EditCategoryAttributeModal = ({
  attribute,
  onClose,
  isOpen,
}: EditCategoryAttributeModalProps) => {
  const editCategoryAttributeMutation = useEditCategoryAttributeMutation();

  const handleEditAttribute = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!attribute) return;

    const formData = new FormData(e.currentTarget);

    const payload = {
      id: attribute.id,
      label: String(formData.get("label") ?? ""),
      isFilterable: formData.get("isFilterable") === "on",
    };

    await editCategoryAttributeMutation.mutateAsync(payload);
    onClose();
  };

  return (
    <Modal.Backdrop isOpen={isOpen}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.CloseTrigger onPress={onClose} />
          <Modal.Header>
            <Modal.Heading className="text-2xl">
              Редактирование атрибута
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <Form
              id="edit-category-attribute"
              onSubmit={handleEditAttribute}
              className="flex flex-col gap-4"
            >
              <Label htmlFor="label" className="flex flex-col gap-1 text-lg">
                Название атрибута*
                <Input
                  id="label"
                  name="label"
                  placeholder="Введите название..."
                  defaultValue={attribute?.label}
                  variant="secondary"
                  required
                />
              </Label>
              <Checkbox
                name="isFilterable"
                defaultSelected={attribute?.isFilterable}
                variant="secondary"
              >
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Checkbox.Content>
                  <Label className="text-lg">Использовать в фильтрации</Label>
                </Checkbox.Content>
              </Checkbox>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button onPress={onClose} variant="secondary">
              Отмена
            </Button>
            <Button
              form="edit-category-attribute"
              type="submit"
              isDisabled={editCategoryAttributeMutation.isPending}
            >
              Подтвердить
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
