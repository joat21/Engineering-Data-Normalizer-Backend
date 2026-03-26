import { Button, Form } from "@heroui/react";
import {
  MappingTargetType,
  type CategoryAttribute,
  type CreateEquipmentBody,
  type MappingTarget,
} from "@engineering-data-normalizer/shared";
import { useCreateEquipmentMutation } from "../api/single-import.api";
import { transformAttribute } from "../model/transformAttribute";
import { useImportStore } from "@/features/import";
import { AttributeField } from "@/entities/category-attribute";

interface SingleImportFormProps {
  attributes?: CategoryAttribute[];
}

export const SingleImportForm = ({ attributes }: SingleImportFormProps) => {
  const createEquipmentMutation = useCreateEquipmentMutation();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const sessionId = useImportStore.getState().sessionId;

    const normalizedData = attributes?.map((attr) => {
      const target: MappingTarget =
        attr.type === MappingTargetType.ATTRIBUTE
          ? {
              type: attr.type,
              id: attr.id,
            }
          : { type: attr.type, field: attr.key as any }; // TODO: в идеале типизировать как системное поле

      const { normalized, rawValue } = transformAttribute({ formData, attr });

      return {
        target,
        rawValue,
        normalized,
      };
    });

    const payload: CreateEquipmentBody = {
      sessionId: sessionId ?? "",
      normalizedData:
        normalizedData?.filter((item) => {
          const val = item.normalized;

          if (
            val.valueString === "" &&
            val.valueMin === undefined &&
            val.valueMax === undefined &&
            val.valueBoolean === undefined
          ) {
            return false;
          }

          return true;
        }) ?? [],
    };

    if (!payload.normalizedData.length) {
      return alert("Заполните хотя бы один атрибут");
    }

    console.log(payload);

    createEquipmentMutation.mutate(payload, {
      onSuccess: () => alert("Оборудование сохранено"),
    });
  };

  return (
    <Form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4 w-full">
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
      <Button type="submit" isPending={createEquipmentMutation.isPending}>
        Сохранить
      </Button>
    </Form>
  );
};
