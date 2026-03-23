import { useCategories } from "@/entities/category";
import {
  Button,
  Card,
  Collection,
  Form,
  Input,
  Label,
  ListBox,
  Select,
} from "@heroui/react";

interface InitImportFormProps {
  onSubmit: (data: { file: File; categoryId: string }) => void;
  isLoading?: boolean;
}

export const InitImportForm = ({
  onSubmit,
  isLoading,
}: InitImportFormProps) => {
  const { data: categories, isPending } = useCategories();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const fileInput = e.currentTarget.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;

    const file = fileInput?.files?.[0];
    const categoryId = String(formData.get("category"));

    if (!file) return alert("Выберите файл");

    onSubmit({ file, categoryId });
  };

  return (
    <Card>
      <Form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input type="file" />
        <Select name="category" placeholder="Выберите категорию">
          <Label>Категория оборудования</Label>
          <Select.Trigger isPending={isPending}>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              <Collection items={categories}>
                {(item) => (
                  <ListBox.Item id={item.id} textValue={item.name}>
                    {item.name}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                )}
              </Collection>
            </ListBox>
          </Select.Popover>
        </Select>
        <Button type="submit" isPending={isLoading}>
          Продолжить
        </Button>
      </Form>
    </Card>
  );
};
