import { useCallback } from "react";
import { type Key } from "@heroui/react";
import {
  MappingTargetType,
  PrevActionType,
  type CategoryAttribute,
  type MappingTarget,
  type StagingColumn,
} from "@engineering-data-normalizer/shared";
import { HeaderColumn } from "./HeaderColumn";
import {
  useSelectionStore,
  useTransformationContextStore,
} from "../model/store";
import { TransformationType } from "../model/types";
import { useMappingMutation } from "@/features/import";

interface TableHeaderProps {
  columns: StagingColumn[];
  attributes: CategoryAttribute[];
  isAttributesPending: boolean;
  sessionId: string;
}

export const TableHeader = ({
  columns,
  attributes,
  isAttributesPending,
  sessionId,
}: TableHeaderProps) => {
  const mappingMutation = useMappingMutation();

  const setContext = useTransformationContextStore((s) => s.setContext);
  const isSelecting = useTransformationContextStore((s) => s.isSelecting);
  const setNormalizationContext = useTransformationContextStore(
    (s) => s.setNormalizationContext,
  );

  const handleSelectAttribute = useCallback(
    (col: StagingColumn, value: Key | null) => {
      const attr = attributes?.find((a) => a.id === value);
      if (!attr) return;

      const target: MappingTarget =
        attr.type === MappingTargetType.ATTRIBUTE
          ? { type: MappingTargetType.ATTRIBUTE, id: attr.id }
          : { type: MappingTargetType.SYSTEM, field: attr.id as any };

      mappingMutation.mutate(
        {
          sessionId,
          colIndex: col.originIndex,
          subIndex: col.subIndex,
          target,
        },
        {
          onSuccess: (data, variables) => {
            if (data.issues.length === 0) return;

            setNormalizationContext({
              issues: data.issues,
              metadata: {
                sessionId: variables.sessionId,
                colIndex: variables.colIndex,
                targets: [variables.target],
                prevActionType: PrevActionType.DIRECT,
              },
            });
          },
        },
      );
    },
    [attributes, mappingMutation, sessionId],
  );

  const handleSelectTransformation = useCallback(
    (col: StagingColumn, type: TransformationType) => {
      if (type === TransformationType.AI_PARSE) {
        useSelectionStore.getState().clear();
        setContext({
          type,
          column: col,
          step: "SELECTING_ROWS",
        });
      } else {
        setContext({ type, column: col });
      }
    },
    [setContext],
  );

  return (
    <thead className="sticky top-0 z-20 shadow-sm">
      <tr className="bg-gray-300">
        {isSelecting && <th className="p-3" />}
        {columns.map((col) => (
          <th key={col.id}>
            <HeaderColumn
              col={col}
              attributes={attributes}
              onSelectAttribute={handleSelectAttribute}
              onSelectTransformation={handleSelectTransformation}
              isAttributesPending={isAttributesPending}
            />
          </th>
        ))}
      </tr>
    </thead>
  );
};
