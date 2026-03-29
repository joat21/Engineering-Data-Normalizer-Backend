import { Button, Form } from "@heroui/react";
import { type CategoryAttribute } from "@engineering-data-normalizer/shared";
import { AttributeField } from "@/entities/category-attribute";

interface SingleImportFormProps {
  attributes: CategoryAttribute[] | undefined;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
}

export const SingleImportForm = ({
  attributes,
  onSubmit,
  isPending,
}: SingleImportFormProps) => {
  return (
    <Form onSubmit={onSubmit} className="grid grid-cols-2 gap-4 w-full">
      {attributes?.map((attr) => (
        <AttributeField
          key={attr.key}
          attributeKey={attr.key}
          label={attr.label}
          unit={attr.unit}
          options={attr.options}
          dataType={attr.dataType}
        />
      ))}
      <Button type="submit" isPending={isPending}>
        Сохранить
      </Button>
    </Form>
  );
};
