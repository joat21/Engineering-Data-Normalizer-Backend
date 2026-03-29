import { useState } from "react";
import { useNavigate } from "react-router";
import { useOverlayState } from "@heroui/react";
import {
  MappingTargetType,
  type CategoryAttribute,
  type CreateEquipmentBody,
  type MappingTarget,
} from "@engineering-data-normalizer/shared";
import { ImportSuccessModal } from "./ImportSuccessModal";
import { SingleImportForm } from "./SingleImportForm";
import { useCreateEquipmentMutation } from "../api/single-import.api";
import { transformAttribute } from "../model/transformAttribute";
import { useImportStore } from "@/features/import";

interface SingleImportCreateProps {
  attributes: CategoryAttribute[] | undefined;
  onInitImport: (data: { file: File; categoryId: string }) => void;
  isLoadingSession: boolean;
}

export const SingleImportCreate = ({
  attributes,
  onInitImport,
  isLoadingSession,
}: SingleImportCreateProps) => {
  const resetImport = useImportStore((s) => s.reset);
  const file = useImportStore((s) => s.file);
  const categoryId = useImportStore((s) => s.categoryId);

  const navigate = useNavigate();
  const successModal = useOverlayState();

  const [formKey, setFormKey] = useState(0);

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

    createEquipmentMutation.mutate(payload, {
      onSuccess: () => successModal.open(),
    });
  };

  const handleFinish = () => {
    resetImport();
    successModal.close();
    navigate("/");
  };

  const handleAddMore = () => {
    successModal.close();
    setFormKey((prev) => prev + 1); // магия реакта для сброса состояния неконтроллируемой формы (reconcilation решает)
    onInitImport({ file: file!, categoryId: categoryId! });
  };

  return (
    <>
      {/* тут будет просмотр загруженного документа */}

      <SingleImportForm
        key={formKey}
        attributes={attributes}
        onSubmit={handleSubmit}
        isPending={createEquipmentMutation.isPending || isLoadingSession}
      />

      <ImportSuccessModal
        isOpen={successModal.isOpen}
        onFinish={handleFinish}
        onAddMore={handleAddMore}
      />
    </>
  );
};
