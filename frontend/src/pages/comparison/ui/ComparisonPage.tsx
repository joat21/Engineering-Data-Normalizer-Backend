import { useState, useMemo } from "react";
import { CategoryTabs } from "./CategoryTabs";
import { ComparisonTable } from "./ComparisonTable";
import { useComparison } from "@/entities/comparison";
import { PageLoader } from "@/shared/ui";
import { ShowOnlyDiffSwitch } from "./ShowOnlyDiffSwitch";

export const ComparisonPage = () => {
  const { data, isPending } = useComparison();

  const [showOnlyDiff, setShowOnlyDiff] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );

  const activeCategoryId = selectedCategoryId || data?.[0]?.categoryId;

  const activeCategory = useMemo(() => {
    return data?.find((c) => c.categoryId === activeCategoryId);
  }, [data, activeCategoryId]);

  if (isPending) return <PageLoader />;

  if (!data || data.length === 0)
    return <div className="p-6">Нет данных для сравнения</div>;

  return (
    <div className="flex flex-col gap-6 p-6 w-full max-w-full overflow-hidden">
      <div className="flex justify-between items-end">
        <h1 className="text-2xl font-medium">Сравнение оборудования</h1>
      </div>

      <CategoryTabs
        activeCategoryId={activeCategoryId}
        setSelectedCategoryId={setSelectedCategoryId}
        data={data}
      />

      <ShowOnlyDiffSwitch
        showOnlyDiff={showOnlyDiff}
        setShowOnlyDiff={setShowOnlyDiff}
      />

      {activeCategory && (
        <ComparisonTable
          activeCategory={activeCategory}
          showOnlyDiff={showOnlyDiff}
        />
      )}
    </div>
  );
};
