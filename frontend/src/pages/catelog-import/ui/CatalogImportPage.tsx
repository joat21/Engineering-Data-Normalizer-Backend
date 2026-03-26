import { InitCatalogImport } from "./InitCatalogImport";
import { InitTable } from "./InitTable";
import { MapColumns } from "./MapColumns";
import { CatalogImportStep, useImportStore } from "@/features/import";

export const CatalogImportPage = () => {
  const step = useImportStore((s) => s.step);
  const categoryId = useImportStore((s) => s.categoryId);
  const sessionId = useImportStore((s) => s.sessionId);

  const renderContent = () => {
    switch (step) {
      case CatalogImportStep.TYPE_SELECTION:
        return <InitCatalogImport />;

      case CatalogImportStep.INIT_TABLE:
        return <InitTable categoryId={categoryId ?? ""} />;

      case CatalogImportStep.MAP_COLUMNS:
        return <MapColumns sessionId={sessionId ?? ""} />;
    }
  };

  return (
    <div className="flex justify-center items-center w-full">
      {renderContent()}
    </div>
  );
};
