import { InitSingleImport } from "./InitSingleImport";
import { SingleImportForm } from "./SingleImportForm";
import { SingleImportStep, useImportStore } from "@/features/import";
import { useCategoryAttributes } from "@/entities/category-attribute";

export const SingleImportPage = () => {
  const { step, categoryId } = useImportStore();
  const { data: categoryAttributes } = useCategoryAttributes(categoryId ?? "");

  return (
    <div className="flex justify-center items-center w-full">
      {step === SingleImportStep.TYPE_SELECTION && <InitSingleImport />}

      {step === SingleImportStep.FILL_ATTRIBUTES && (
        <SingleImportForm attributes={categoryAttributes} />
      )}
    </div>
  );
};
