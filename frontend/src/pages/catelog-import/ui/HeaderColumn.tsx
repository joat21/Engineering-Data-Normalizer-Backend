import { memo, useCallback } from "react";
import { Label, type Key } from "@heroui/react";
import type {
  CategoryAttribute,
  StagingColumn,
} from "@engineering-data-normalizer/shared";
import { TransformationDropdown } from "./TransformationDropdown";
import type { TransformationType } from "../model/types";
import { AppSelect } from "@/shared/ui";

interface ColumnHeaderProps {
  col: StagingColumn;
  attributes: CategoryAttribute[];
  onSelectAttribute: (col: StagingColumn, value: Key | null) => void;
  onSelectTransformation: (
    col: StagingColumn,
    type: TransformationType,
  ) => void;
  isAttributesPending: boolean;
}

export const HeaderColumn = memo(
  ({
    col,
    attributes,
    onSelectAttribute,
    onSelectTransformation,
    isAttributesPending,
  }: ColumnHeaderProps) => {
    const handleSelectTransformation = useCallback(
      (type: Key) => {
        onSelectTransformation(col, type as TransformationType);
      },
      [col, onSelectTransformation],
    );

    return (
      <div className="flex flex-col gap-2 p-3 min-w-55">
        <Label className="text-base font-bold truncate">{col.label}</Label>
        <div className="flex items-center gap-1">
          <AppSelect
            className="flex-1"
            items={attributes}
            getItemKey={(attr) => attr.id}
            getItemLabel={(attr) => attr.label}
            aria-label="Атрибуты"
            isPending={isAttributesPending}
            placeholder="Атрибут"
            onChange={(value) => onSelectAttribute(col, value)}
          />
          <TransformationDropdown onAction={handleSelectTransformation} />
        </div>
      </div>
    );
  },
);
