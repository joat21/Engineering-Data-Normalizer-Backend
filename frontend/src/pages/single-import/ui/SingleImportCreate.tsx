import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, useOverlayState } from "@heroui/react";
import { ArrowLeft, FileText } from "lucide-react";
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
import { SingleImportStep, useImportStore } from "@/features/import";

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
  const categoryName = useImportStore((s) => s.categoryName);
  const setStep = useImportStore((s) => s.setStep);

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
      <div className="flex flex-col w-full">
        <Button
          className="mb-4"
          variant="ghost"
          onClick={() => setStep(SingleImportStep.TYPE_SELECTION)}
        >
          <ArrowLeft className="mr-2" /> К выбору файла
        </Button>

        {/* тут будет просмотр загруженного документа */}

        <div className="flex flex-col gap-6">
          <div>
            <h1 className="mb-2 text-2xl font-bold">Добавление оборудования</h1>
            <p className="text-lg">
              Заполните характеристики для категории:{" "}
              <span className="font-semibold text-foreground">
                {categoryName}
              </span>
            </p>
          </div>

          <div className="bg-white border rounded-lg p-4 flex items-center gap-4">
            <FileText className="text-primary" size={32} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{file?.name}</p>
              <p className="text-xs text-muted-foreground">
                {((file?.size ?? 0) / 1024).toFixed(2)} KB
              </p>
            </div>
          </div>

          <Card className="p-6 rounded-xl">
            <SingleImportForm
              key={formKey}
              attributes={attributes}
              onSubmit={handleSubmit}
              isPending={createEquipmentMutation.isPending || isLoadingSession}
            />
          </Card>
        </div>
      </div>

      <ImportSuccessModal
        isOpen={successModal.isOpen}
        onFinish={handleFinish}
        onAddMore={handleAddMore}
      />
    </>
  );
};
