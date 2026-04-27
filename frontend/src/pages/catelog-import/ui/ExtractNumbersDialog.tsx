import { useState } from "react";
import { Button, Modal, type Key } from "@heroui/react";
import { Hash } from "lucide-react";
import {
  MappingTargetType,
  parseNumbers,
  PrevActionType,
  TransformType,
  type MappingTarget,
} from "@engineering-data-normalizer/shared";
import { Mapping } from "./Mapping";
import { SourceValues } from "./SourceValues";
import { ModalHeader } from "./ModalHeader";
import { ModalBody } from "./ModalBody";
import { useTransformationContextStore } from "../model/store";
import type { TransformationDialogProps } from "../model/types";
import { useApplyTransformMutation } from "@/features/import";

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

  const sourceValue = rows[0]?.values[column.id] || "—";
  const extractedNumbers = parseNumbers(sourceValue);

  const [targets, setTargets] = useState<(MappingTarget | null)[]>(
    Array(extractedNumbers.length).fill(null),
  );

  const applyTransformMutation = useApplyTransformMutation();

  const handleSelectAttribute = (value: Key | null, index: number) => {
    if (!value) return;

    const selectedAttr = attributes.find((attr) => attr.id === String(value));
    if (!selectedAttr) return;

    const newTargets = targets;
    newTargets[index] =
      selectedAttr.type === MappingTargetType.ATTRIBUTE
        ? {
            type: selectedAttr.type,
            id: String(value),
          }
        : { type: selectedAttr.type, field: selectedAttr.id as any };

    setTargets(newTargets);
  };

  const handleApply = () => {
    const payload = {
      sessionId,
      colIndex: column.originIndex,
      subIndex: column.subIndex,
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
    <Modal.Dialog aria-label="Извлечение чисел">
      <Modal.CloseTrigger onPress={onClose} />
      <ModalHeader
        title="Извлечение чисел"
        columnName={column.label}
        icon={Hash}
      />
      <ModalBody>
        <SourceValues
          title="Пример исходного значения"
          values={[sourceValue]}
        />

        <Mapping
          values={extractedNumbers}
          attributes={attributes}
          onSelectAttribute={handleSelectAttribute}
        />
      </ModalBody>
      <Modal.Footer>
        <Button onPress={onClose} variant="secondary">
          Отмена
        </Button>
        <Button onPress={handleApply}>Применить</Button>
      </Modal.Footer>
    </Modal.Dialog>
  );
};
