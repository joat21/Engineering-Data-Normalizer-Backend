import { useState } from "react";
import { Button, Card, Form } from "@heroui/react";
import type { SourceType } from "@engineering-data-normalizer/shared";
import { useCategories } from "@/entities/category";
import { AppSelect, FileDropzone } from "@/shared/ui";
import { ACCEPTED_FORMATS } from "../model/config";

interface InitImportFormProps {
  onSubmit: (data: {
    file: File;
    categoryId: string;
    categoryName?: string;
  }) => void;
  isLoading?: boolean;
  sourceType: SourceType;
}

export const InitImportForm = ({
  onSubmit,
  isLoading,
  sourceType,
}: InitImportFormProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const { data: categories, isPending } = useCategories();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!categoryId) return;
    if (!file) return alert("Выберите файл");

    onSubmit({
      file,
      categoryId,
      categoryName: categories?.find((c) => c.id === categoryId)?.name,
    });
  };

  return (
    <Card className="flex-col gap-5 p-6 self-center max-w-125 w-full">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-semibold">Выбор файла и категории</h2>
        <p className="text-default-foreground/60">
          Загрузите файл и укажите категорию оборудования для дальнейшей
          обработки
        </p>
      </div>

      <Form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <FileDropzone
          onFileSelect={setFile}
          accept={ACCEPTED_FORMATS[sourceType]}
        />
        {file && (
          <p className="text-sm text-default-foreground/60">
            Выбран файл: {file.name}
          </p>
        )}

        <AppSelect
          name="category"
          label="Категория оборудования"
          placeholder="Выберите категорию"
          items={categories ?? []}
          isPending={isPending}
          getItemKey={(item) => item.id}
          getItemLabel={(item) => item.name}
          value={categoryId}
          onChange={(value) => setCategoryId(String(value))}
          variant="secondary"
          isRequired
        />

        <Button
          className="self-end"
          type="submit"
          isDisabled={!file || !categoryId}
          isPending={isLoading}
        >
          Продолжить
        </Button>
      </Form>
    </Card>
  );
};
