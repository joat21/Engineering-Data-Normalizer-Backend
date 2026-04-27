import { memo, useCallback, useState } from "react";
import { Accordion, Button } from "@heroui/react";
import { Filter } from "lucide-react";
import type {
  CategoryFilter,
  FilterValue,
} from "@engineering-data-normalizer/shared";
import { useEquipmentTableQuery } from "../model/useEquipmentTableQuery";
import { FilterField } from "@/entities/category-filters";

interface FiltersProps {
  filters: CategoryFilter[] | undefined;
}

export const Filters = memo(({ filters }: FiltersProps) => {
  const { query, updateQuery } = useEquipmentTableQuery();
  const [draftFilters, setDraftFilters] = useState<Record<string, FilterValue>>(
    query.filters ?? {},
  );

  if (!filters?.length) return null;

  const handleFilterChange = useCallback(
    (key: string, value: FilterValue | undefined) => {
      setDraftFilters((prev) => {
        if (value === undefined) {
          const { [key]: removedKey, ...rest } = prev;
          return rest;
        }

        return { ...prev, [key]: value };
      });
    },
    [],
  );

  const handleApplyFilters = () => {
    updateQuery({
      ...query,
      filters: draftFilters,
      page: 1,
    });
  };

  const handleResetAll = () => {
    setDraftFilters({});
    updateQuery({ ...query, filters: {} });
  };

  return (
    <aside className="w-80 shrink-0 sticky top-4">
      <div className="flex flex-col h-full rounded-2xl border bg-white overflow-hidden">
        <div className="flex items-center gap-2 p-5 pb-2">
          <div className="p-2 bg-primary-50 text-primary rounded-lg">
            <Filter size={20} />
          </div>
          <h3 className="font-semibold text-lg">Фильтры</h3>
        </div>

        <div className="relative flex flex-col gap-4">
          <Accordion className="gap-2 px-2">
            {filters.map((filter) => (
              <Accordion.Item key={filter.key} aria-label={filter.label}>
                <Accordion.Heading className="items-center pl-3">
                  <Accordion.Indicator />
                  <Accordion.Trigger className="text-base font-semibold">
                    {filter.label} {filter.unit && `(${filter.unit})`}
                  </Accordion.Trigger>
                </Accordion.Heading>
                <Accordion.Panel className="px-4">
                  <FilterField
                    filter={filter}
                    value={draftFilters[filter.key]}
                    onChange={handleFilterChange}
                  />
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>

          <div className="sticky bottom-0 flex flex-col gap-2 p-4 border-t">
            <Button
              className="font-bold"
              onPress={handleApplyFilters}
              fullWidth
            >
              Применить
            </Button>
            <Button
              className="font-medium"
              variant="outline"
              fullWidth
              onPress={handleResetAll}
            >
              Сбросить
            </Button>
          </div>
        </div>
      </div>
    </aside>
  );
});
