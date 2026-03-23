import { InitCatalogImport } from "./InitCatalogImport";
import { CatalogImportStep, useImportStore } from "@/features/import";
import { InitTable } from "./InitTable";

export const CatalogImportPage = () => {
  const { step, categoryId } = useImportStore();

  return (
    <div className="flex justify-center items-center w-full">
      {step === CatalogImportStep.TYPE_SELECTION && <InitCatalogImport />}

      {step === CatalogImportStep.INIT_TABLE && (
        <InitTable categoryId={categoryId ?? ""} />
      )}
    </div>
  );
};
