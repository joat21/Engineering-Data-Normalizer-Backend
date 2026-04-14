import { Tabs } from "@heroui/react";
import type { ComparisonCategory } from "@engineering-data-normalizer/shared";

interface CategoryTabsProps {
  activeCategoryId: string | undefined;
  setSelectedCategoryId: (key: string) => void;
  data: ComparisonCategory[];
}

export const CategoryTabs = ({
  activeCategoryId,
  setSelectedCategoryId,
  data,
}: CategoryTabsProps) => {
  return (
    <Tabs
      selectedKey={activeCategoryId}
      onSelectionChange={(key) => setSelectedCategoryId(key as string)}
      aria-label="Категории"
    >
      <Tabs.ListContainer className="w-fit">
        <Tabs.List aria-label="Категории">
          {data.map((item) => (
            <Tabs.Tab id={item.categoryId} className="whitespace-nowrap">
              {item.categoryName}
              <Tabs.Indicator />
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
    </Tabs>
  );
};
