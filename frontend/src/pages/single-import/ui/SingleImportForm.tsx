import { Button, Form } from "@heroui/react";
import {
  MappingTargetType,
  type CategoryAttribute,
} from "@engineering-data-normalizer/shared";
import { AttributeField } from "@/entities/category-attribute";
import { useMemo } from "react";

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
  const [systemFields, technicalFields] = useMemo(() => {
    const systemFields =
      attributes?.filter((a) => a.type === MappingTargetType.SYSTEM) || [];
    const technicalFields =
      attributes?.filter((a) => a.type === MappingTargetType.ATTRIBUTE) || [];

    return [systemFields, technicalFields];
  }, [attributes]);

  return (
    <Form onSubmit={onSubmit} className="space-y-8">
      <section>
        <h3 className="text-xl font-semibold mb-4">Основные данные</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {systemFields.map((attr) => (
            <AttributeField
              key={attr.key}
              attributeKey={attr.key}
              label={attr.label}
              unit={attr.unit}
              options={attr.options}
              dataType={attr.dataType}
              variant="secondary"
            />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xl font-semibold mb-4">
          Технические характеристики
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          {technicalFields.map((attr) => (
            <AttributeField
              key={attr.key}
              attributeKey={attr.key}
              label={attr.label}
              unit={attr.unit}
              options={attr.options}
              dataType={attr.dataType}
              variant="secondary"
            />
          ))}
        </div>
      </section>
      <Button type="submit" isPending={isPending}>
        Сохранить
      </Button>
    </Form>
  );
};
