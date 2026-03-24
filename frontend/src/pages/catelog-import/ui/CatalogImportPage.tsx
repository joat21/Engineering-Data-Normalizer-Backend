import { InitCatalogImport } from "./InitCatalogImport";
import { CatalogImportStep, useImportStore } from "@/features/import";
import { InitTable } from "./InitTable";

export const CatalogImportPage = () => {
  const { step, categoryId } = useImportStore();

  const renderContent = () => {
    switch (step) {
      case CatalogImportStep.TYPE_SELECTION:
        return <InitCatalogImport />;

      case CatalogImportStep.INIT_TABLE:
        return <InitTable categoryId={categoryId ?? ""} />;

      case CatalogImportStep.MAP_COLUMNS:
        return "Ты думал тут что то будет?";
    }
  };

  return (
    <div className="flex justify-center items-center w-full">
      {renderContent()}
    </div>
  );
};
