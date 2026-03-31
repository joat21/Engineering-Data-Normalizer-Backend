import type { Key } from "@heroui/react";
import type { CategoryAttribute } from "@engineering-data-normalizer/shared";
import { AppSelect } from "@/shared/ui";

interface MappingProps {
  values: (string | number)[];
  attributes: CategoryAttribute[];
  onSelectAttribute: (value: Key | null, index: number) => void;
}

export const Mapping = ({
  values,
  attributes,
  onSelectAttribute,
}: MappingProps) => {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <span className="font-medium">Сопоставление:</span>
        <span className="text-sm">
          Не обязательно сопоставлять все извлеченные части. Оставьте пустыми
          поля для тех значений, которые нужно проигнорировать.
        </span>
      </div>

      <div className="flex flex-col gap-2 max-h-[40vh] overflow-auto">
        {values.map((value, i) => (
          <div
            key={i}
            className="grid grid-cols-[minmax(100px,40%)_1fr] items-center gap-2"
          >
            <span
              title={String(value ?? "")}
              className="flex items-center justify-center p-1 border border-accent/50 bg-accent/5 rounded-md font-mono whitespace-nowrap"
            >
              {value}
            </span>
            <AppSelect
              items={attributes}
              getItemKey={(attr) => attr.id}
              getItemLabel={(attr) => attr.label}
              variant="secondary"
              className="w-full"
              aria-label={`Атрибут для значения ${value}`}
              placeholder="Выберите атрибут..."
              onChange={(attrId) => onSelectAttribute(attrId, i)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
