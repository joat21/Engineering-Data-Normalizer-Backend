import { SourceType } from "@engineering-data-normalizer/shared";
import {
  InitImportForm,
  SingleImportStep,
  useImportStore,
  useInitImportMutation,
} from "@/features/import";

export const InitSingleImport = () => {
  const { setInitialData, setSessionId, setStep } = useImportStore();
  const initImportMutation = useInitImportMutation();

  const handleInit = (data: { file: File; categoryId: string }) => {
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
    <InitImportForm
      onSubmit={handleInit}
      isLoading={initImportMutation.isPending}
    />
  );
};
