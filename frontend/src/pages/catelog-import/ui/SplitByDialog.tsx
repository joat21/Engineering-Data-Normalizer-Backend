import { useState } from "react";
import { Button, Input, Modal, type Key } from "@heroui/react";
import {
  MappingTargetType,
  PrevActionType,
  splitBySeparator,
  TransformType,
  type MappingTarget,
} from "@engineering-data-normalizer/shared";
import { separators } from "../model/constants";
import { useTransformationContextStore } from "../model/store";
import type { TransformationDialogProps } from "../model/types";

import { useApplyTransformMutation } from "@/features/import";
import { AppSelect } from "@/shared/ui";

export const SplitByDialog = ({
  column,
  rows,
  attributes,
  sessionId,
  onClose,
}: TransformationDialogProps) => {
  const setNormalizationContext = useTransformationContextStore(
    (s) => s.setNormalizationContext,
  );

  const sourceValue = rows[0]?.values[column.id] || "";

  const [selectedSeparator, setSelectedSeparator] = useState<string | null>(
    null,
  );
  const [splitted, setSplitted] = useState<string[] | null>(null);
  const [targets, setTargets] = useState<(MappingTarget | null)[]>([]);

  const applyTransformMutation = useApplyTransformMutation();

  const handleSelectSeparator = (sep: Key | null) => {
    if (!sep) return;

    setSelectedSeparator(String(sep));
    setSplitted(splitBySeparator(sourceValue, String(sep)));
  };

  const handleSelectAttribute = (value: Key | null, index: number) => {
    if (!value) return;

    const newTargets = targets;
    newTargets[index] = {
      type: MappingTargetType.ATTRIBUTE,
      id: String(value),
    };

    setTargets(newTargets);
  };

  const handleApply = () => {
    if (!selectedSeparator) return;

    const payload = {
      sessionId,
      colIndex: column.originIndex,
      transform: {
        type: TransformType.SPLIT_BY,
        payload: { separator: selectedSeparator },
      },
      targets: targets,
    };

    applyTransformMutation.mutate(payload, {
      onSuccess: (data, variables) => {
        if (data.issues.length > 0) {
          setNormalizationContext({
            issues: data.issues,
            metadata: {
              sessionId: variables.sessionId,
              colIndex: variables.colIndex,
              targets: variables.targets,
              prevActionType: PrevActionType.DIRECT,
            },
          });
        }

        onClose();
      },
    });
  };

  return (
    <Modal.Dialog aria-label="Разбить по символу" className="sm:max-w-90">
      <Modal.CloseTrigger />
      <Modal.Header>
        <div>
          <h2 className="text-xl font-semibold">Разбить по символу</h2>
          <p className="text-sm text-gray-600 mt-1">Колонка: {column.label}</p>
        </div>
      </Modal.Header>
      <Modal.Body>
        <div className="flex flex-col gap-1">
          <span>Исходное значение:</span>
          <Input
            value={sourceValue ?? ""}
            variant="secondary"
            aria-label="Исходное значение"
            disabled
          />
        </div>
        <div className="flex flex-col gap-1">
          <span>Выберите разделитель:</span>
          <AppSelect
            items={separators}
            getItemKey={(s) => s.key}
            getItemLabel={(s) => s.label}
            aria-label="Разделитель"
            onChange={handleSelectSeparator}
          />
        </div>
        {splitted && (
          <div className="flex flex-col gap-1">
            <span>Результат разбиения:</span>
            {splitted.map((part, i) => (
              <div key={i} className="flex gap-1">
                <span>{part}</span>
                <AppSelect
                  items={attributes}
                  getItemKey={(attr) => attr.id}
                  getItemLabel={(attr) => attr.label}
                  variant="secondary"
                  className="w-full"
                  aria-label={`Атрибут для части ${part}`}
                  onChange={(attrId) => handleSelectAttribute(attrId, i)}
                />
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button onPress={onClose} variant="secondary">
          Отмена
        </Button>
        <Button onPress={handleApply}>Применить</Button>
      </Modal.Footer>
    </Modal.Dialog>
  );
};
