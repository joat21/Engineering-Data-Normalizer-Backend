import { useState } from "react";
import { useNavigate } from "react-router";
import { Button, Card, toast, useOverlayState } from "@heroui/react";
import { ArrowLeft, Plus } from "lucide-react";
import {
  MappingTargetType,
  type CategoryAttribute,
  type CreateEquipmentBody,
  type MappingTarget,
} from "@engineering-data-normalizer/shared";
import { PdfViewer } from "./PdfViewer";
import { ImportSuccessModal } from "./ImportSuccessModal";
import { SingleImportForm } from "./SingleImportForm";
import { useCreateEquipmentMutation } from "../api/single-import.api";
import { transformAttribute } from "../model/transformAttribute";
import { SingleImportStep, useImportStore } from "@/features/import";
import { CreateCategoryAttributeModal } from "@/features/create-category-attibute";

interface SingleImportCreateProps {
  attributes: CategoryAttribute[] | undefined;
  onInitImport: (data: {
    file: File;
    categoryId: string;
    manufacturerId: string;
    supplierId: string;
  }) => void;
  isLoadingSession: boolean;
  fileUrl: string;
}

export const SingleImportCreate = ({
  attributes,
  onInitImport,
  isLoadingSession,
  fileUrl,
}: SingleImportCreateProps) => {
  const resetImport = useImportStore((s) => s.reset);
  const file = useImportStore((s) => s.file);
  const categoryId = useImportStore((s) => s.categoryId);
  const categoryName = useImportStore((s) => s.categoryName);
  const setStep = useImportStore((s) => s.setStep);
  const manufacturerId = useImportStore((s) => s.manufacturerId);
  const supplierId = useImportStore((s) => s.supplierId);

  const navigate = useNavigate();
  const successModal = useOverlayState();
  const createCategoryAttributeModal = useOverlayState();

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
      return toast.danger("Заполните хотя бы один атрибут");
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
    onInitImport({
      file: file!,
      categoryId: categoryId!,
      manufacturerId: manufacturerId!,
      supplierId: supplierId!,
    });
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

        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="mb-2 text-2xl font-semibold">
              Добавление оборудования
            </h1>
            <div className="flex items-center gap-2 ">
              <span>
                Категория: <b>{categoryName}</b>
              </span>
              <span> |</span>
              <Button onPress={createCategoryAttributeModal.open} size="sm">
                <Plus size={16} />
                Добавить новый атрибут
              </Button>
            </div>
          </div>

          <div className="flex gap-3">
            <Card className="p-0 rounded-xl w-full min-w-0 min-h-0">
              <PdfViewer fileUrl={fileUrl} />
            </Card>
            <Card className="p-6 rounded-xl w-full">
              <SingleImportForm
                key={formKey}
                attributes={attributes}
                onSubmit={handleSubmit}
                isPending={
                  createEquipmentMutation.isPending || isLoadingSession
                }
              />
            </Card>
          </div>
        </div>
      </div>

      <CreateCategoryAttributeModal
        categoryId={categoryId}
        isOpen={createCategoryAttributeModal.isOpen}
        onClose={createCategoryAttributeModal.close}
      />

      <ImportSuccessModal
        isOpen={successModal.isOpen}
        onFinish={handleFinish}
        onAddMore={handleAddMore}
      />
    </>
  );
};
