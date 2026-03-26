import { useState } from "react";
import { Button, Input, Modal, type Key } from "@heroui/react";
import {
  MappingTargetType,
  parseNumbers,
  PrevActionType,
  TransformType,
  type MappingTarget,
} from "@engineering-data-normalizer/shared";
import { useTransformationContextStore } from "../model/store";
import type { TransformationDialogProps } from "../model/types";
import { useApplyTransformMutation } from "@/features/import";
import { AppSelect } from "@/shared/ui";

export const ExtractNumbersDialog = ({
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
  const extractedNumbers = parseNumbers(sourceValue);

  const [targets, setTargets] = useState<(MappingTarget | null)[]>(
    Array(extractedNumbers.length).fill(null),
  );

  const applyTransformMutation = useApplyTransformMutation();

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
    const payload = {
      sessionId,
      colIndex: column.originIndex,
      transform: { type: TransformType.EXTRACT_NUMBERS },
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
    <Modal.Dialog aria-label="Извлечь числа" className="sm:max-w-90">
      <Modal.CloseTrigger />
      <Modal.Header>
        <div>
          <h2 className="text-xl font-semibold">Извлечь числа</h2>
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
          <span>Извлеченные числа:</span>
          {extractedNumbers.map((num, i) => (
            <div key={i} className="flex gap-1">
              <span>{num}</span>
              <AppSelect
                items={attributes}
                getItemKey={(attr) => attr.id}
                getItemLabel={(attr) => attr.label}
                variant="secondary"
                className="w-full"
                aria-label={`Атрибут для числа ${num}`}
                onChange={(attrId) => handleSelectAttribute(attrId, i)}
              />
            </div>
          ))}
        </div>
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
