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
  const setInitialData = useImportStore((s) => s.setInitialData);
  const setSessionId = useImportStore((s) => s.setSessionId);

  const initImportMutation = useInitImportMutation();

  const { data: categoryAttributes } = useCategoryAttributes(categoryId ?? "");

  const handleInitImport = (data: { file: File; categoryId: string }) => {
    initImportMutation.mutate(
      { ...data, sourceType: SourceType.SINGLE_ITEM },
      {
        onSuccess: (res) => {
          setInitialData({ ...data, sourceType: SourceType.SINGLE_ITEM });
          setSessionId(res.sessionId);
          setStep(SingleImportStep.FILL_ATTRIBUTES);
        },
      },
    );
  };

  return (
    <div className="flex justify-center items-center w-full">
      {step === SingleImportStep.TYPE_SELECTION && (
        <InitImportForm
          onSubmit={handleInitImport}
          isLoading={initImportMutation.isPending}
        />
      )}

      {step === SingleImportStep.FILL_ATTRIBUTES && (
        <SingleImportCreate
          attributes={categoryAttributes}
          onInitImport={handleInitImport}
          isLoadingSession={initImportMutation.isPending}
        />
      )}
    </div>
  );
};
