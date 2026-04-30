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
import { TransformationType, type TableActionKey } from "../model/types";
import { useMappingMutation } from "@/features/import";

interface TableHeaderProps {
  columns: StagingColumn[];
  attributes: CategoryAttribute[];
  isAttributesPending: boolean;
  sessionId: string;
  onSelectColToReset: (col: StagingColumn) => void;
}

export const TableHeader = ({
  columns,
  attributes,
  isAttributesPending,
  sessionId,
  onSelectColToReset,
}: TableHeaderProps) => {
  const mappingMutation = useMappingMutation();

  const isSelecting = useSelectionStore((s) => !!s.activeContext);
  const setSelectionContext = useSelectionStore((s) => s.setContext);
  const setTransformationContext = useTransformationContextStore(
    (s) => s.setContext,
  );
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

  const handleAction = useCallback(
    (col: StagingColumn, key: Key) => {
      const actionType = key as TableActionKey;

      if (actionType === "reset-col") {
        onSelectColToReset(col);
        return;
      }

      if (actionType === TransformationType.AI_PARSE) {
        useSelectionStore.getState().clear();
        setTransformationContext({
          type: actionType,
          column: col,
          step: "SELECTING_ROWS",
        });
        setSelectionContext("ai_parse");
      } else {
        setTransformationContext({ type: actionType, column: col });
      }
    },
    [setTransformationContext],
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
              onSelectTransformation={handleAction}
              isAttributesPending={isAttributesPending}
            />
          </th>
        ))}
      </tr>
    </thead>
  );
};
