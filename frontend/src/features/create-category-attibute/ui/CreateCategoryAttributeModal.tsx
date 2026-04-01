import { Button, Checkbox, Form, Input, Label, Modal } from "@heroui/react";
import { useCreateCategoryAttributeMutation } from "../api/create-category-attibute.api";
import { DATA_TYPE_OPTIONS } from "../model/config";
import { AppSelect } from "@/shared/ui";
import { DataType } from "@engineering-data-normalizer/shared";

interface CreateCategoryAttributeModalProps {
  categoryId: string;
  onClose: () => void;
  isOpen: boolean;
}

export const CreateCategoryAttributeModal = ({
  categoryId,
  onClose,
  isOpen,
}: CreateCategoryAttributeModalProps) => {
  const createCategoryAttributeMutation = useCreateCategoryAttributeMutation();

  const handleCreateCategoryAttribute = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const payload = {
      id: categoryId,
      label: String(formData.get("label") ?? ""),
      dataType: (formData.get("dataType") as DataType) ?? DataType.STRING,
      unit: String(formData.get("unit") ?? ""),
      isFilterable: formData.get("isFilterable") === "on",
    };

    await createCategoryAttributeMutation.mutateAsync(payload);
    onClose();
  };

  return (
    <Modal.Backdrop isOpen={isOpen}>
      <Modal.Container>
        <Modal.Dialog>
          <Modal.CloseTrigger onPress={onClose} />
          <Modal.Header>
            <Modal.Heading className="text-2xl">
              Создание атрибута
            </Modal.Heading>
          </Modal.Header>
          <Modal.Body>
            <Form
              id="create-category-attribute"
              onSubmit={handleCreateCategoryAttribute}
              className="flex flex-col gap-4"
            >
              <Label htmlFor="label" className="flex flex-col gap-1 text-lg">
                Название атрибута*
                <Input
                  id="label"
                  name="label"
                  placeholder="Введите название..."
                  variant="secondary"
                  required
                />
              </Label>
              <Label htmlFor="dataType" className="flex flex-col gap-1 text-lg">
                Тип атрибута*
                <AppSelect
                  id="dataType"
                  name="dataType"
                  items={DATA_TYPE_OPTIONS}
                  getItemKey={(o) => o.key}
                  getItemLabel={(o) => o.label}
                  variant="secondary"
                  aria-label="Тип атрибута"
                  isRequired
                />
              </Label>
              <Label htmlFor="unit" className="flex flex-col gap-1 text-lg">
                Единица измерения
                <Input
                  id="unit"
                  name="unit"
                  placeholder="Введите название..."
                  variant="secondary"
                />
              </Label>
              <Checkbox name="isFilterable" variant="secondary">
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
              form="create-category-attribute"
              type="submit"
              isDisabled={createCategoryAttributeMutation.isPending}
            >
              Подтвердить
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
};
