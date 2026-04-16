import { useEffect, useState } from "react";
import { SourceType } from "@engineering-data-normalizer/shared";
import { SingleImportCreate } from "./SingleImportCreate";
import {
  InitImportForm,
  SingleImportStep,
  useImportStore,
  useInitImportMutation,
} from "@/features/import";
import { useCategoryAttributes } from "@/entities/category-attribute";

export const SingleImportPage = () => {
  const step = useImportStore((s) => s.step);
  const setStep = useImportStore((s) => s.setStep);
  const categoryId = useImportStore((s) => s.categoryId);
  const setCategoryName = useImportStore((s) => s.setCategoryName);
  const setInitialData = useImportStore((s) => s.setInitialData);
  const setSessionId = useImportStore((s) => s.setSessionId);
  const resetImport = useImportStore((s) => s.reset);

  const initImportMutation = useInitImportMutation();

  const [fileUrl, setFileUrl] = useState("");

  const { data: categoryAttributes } = useCategoryAttributes(categoryId ?? "");

  useEffect(() => {
    return () => resetImport();
  }, []);

  const handleInitImport = (data: {
    file: File;
    categoryId: string;
    categoryName?: string;
    manufacturerId: string;
    supplierId: string;
  }) => {
    initImportMutation.mutate(
      { ...data, sourceType: SourceType.SINGLE_ITEM },
      {
        onSuccess: (res) => {
          setInitialData({ ...data, sourceType: SourceType.SINGLE_ITEM });
          setSessionId(res.sessionId);
          setStep(SingleImportStep.FILL_ATTRIBUTES);
          setCategoryName(data.categoryName);
          setFileUrl(res.pdfUrl);
        },
      },
    );
  };

  return (
    <div className="flex justify-center w-full">
      {step === SingleImportStep.TYPE_SELECTION && (
        <InitImportForm
          onSubmit={handleInitImport}
          isLoading={initImportMutation.isPending}
          sourceType={SourceType.SINGLE_ITEM}
        />
      )}

      {step === SingleImportStep.FILL_ATTRIBUTES && (
        <SingleImportCreate
          attributes={categoryAttributes}
          onInitImport={handleInitImport}
          isLoadingSession={initImportMutation.isPending}
          fileUrl={fileUrl}
        />
      )}
    </div>
  );
};
