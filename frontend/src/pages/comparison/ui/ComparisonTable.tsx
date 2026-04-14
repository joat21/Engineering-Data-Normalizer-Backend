import type { ComparisonCategory } from "@engineering-data-normalizer/shared";
import { cn } from "@heroui/styles";

interface ComparisonTableProps {
  activeCategory: ComparisonCategory;
  showOnlyDiff: boolean;
}

export const ComparisonTable = ({
  activeCategory,
  showOnlyDiff,
}: ComparisonTableProps) => {
  return (
    <div className="border rounded-xl bg-white shadow-sm overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap min-w-max">
        <thead className="bg-default border-b">
          <tr>
            <th className="sticky left-0 p-4 border-r font-semibold bg-default z-10">
              Характеристика
            </th>
            {activeCategory.items.map((item, index) => {
              const title =
                item.values["model"] && item.values["model"] !== "—"
                  ? item.values["model"]
                  : `Позиция ${index + 1}`;

              return (
                <th
                  key={item.id}
                  className="p-4 font-semibold min-w-50 border-r last:border-0"
                >
                  {title}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {activeCategory.fields.map((field) => {
            const valuesInRow =
              activeCategory?.items.map(
                (item) => item.values[field.key] ?? "—",
              ) || [];

            const isDifferent = new Set(valuesInRow).size > 1;

            if (showOnlyDiff && !isDifferent) return true;

            return (
              <tr
                key={field.key}
                className={cn(
                  "border-b last:border-0 hover:bg-default/50 transition-colors",
                  isDifferent &&
                    !showOnlyDiff &&
                    "bg-warning-soft hover:bg-warning-soft-hover",
                )}
              >
                <td className="sticky left-0 p-4 font-medium bg-white border-r z-10">
                  {field.label}
                </td>

                {activeCategory.items.map((item) => {
                  const value = item.values[field.key];

                  return (
                    <td
                      key={`${item.id}-${field.key}`}
                      className="p-4 border-r last:border-0"
                    >
                      {value !== undefined && value !== null ? value : "—"}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
