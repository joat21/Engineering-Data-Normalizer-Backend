import { memo, useCallback, useEffect, useState } from "react";
import { Label, type Key } from "@heroui/react";
import type {
  CategoryAttribute,
  StagingColumn,
} from "@engineering-data-normalizer/shared";
import { TransformationDropdown } from "./TransformationDropdown";
import type { TransformationType } from "../model/types";
import { AppSelect } from "@/shared/ui";
import { getSelectedAttrId } from "../model/utils";

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
    const [selectedAttrId, setSelectedAttrId] = useState<string | null>(() =>
      getSelectedAttrId(attributes, col),
    );

    useEffect(() => {
      setSelectedAttrId(getSelectedAttrId(attributes, col));
    }, [getSelectedAttrId, attributes, col]);

    const handleSelectAttribute = (col: StagingColumn, value: Key | null) => {
      setSelectedAttrId(String(value));
      onSelectAttribute(col, value);
    };

    const handleSelectTransformation = useCallback(
      (type: Key) => {
        onSelectTransformation(col, type as TransformationType);
      },
      [col, onSelectTransformation],
    );

    return (
      <div className="flex flex-col gap-2 p-3 min-w-55">
        <Label className="text-base font-bold truncate">
          {col.label} {col.unit && `(${col.unit})`}
        </Label>
        <div className="flex items-center gap-1">
          <AppSelect
            className="flex-1"
            items={attributes}
            getItemKey={(attr) => attr.id}
            getItemLabel={(attr) =>
              attr.unit ? `${attr.label} (${attr.unit})` : attr.label
            }
            aria-label="Атрибуты"
            isPending={isAttributesPending}
            placeholder="Атрибут"
            value={selectedAttrId}
            onChange={(value) => handleSelectAttribute(col, value)}
          />
          <TransformationDropdown onAction={handleSelectTransformation} />
        </div>
      </div>
    );
  },
);
