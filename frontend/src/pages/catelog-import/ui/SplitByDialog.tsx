import { useState } from "react";
import { Button, Input, Label, Modal, type Key } from "@heroui/react";
import { Scissors } from "lucide-react";
import {
  MappingTargetType,
  PrevActionType,
  splitBySeparator,
  TransformType,
  type MappingTarget,
} from "@engineering-data-normalizer/shared";
import { Mapping } from "./Mapping";
import { SourceValues } from "./SourceValues";
import { ModalBody } from "./ModalBody";
import { ModalHeader } from "./ModalHeader";
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

  const sourceValue = rows[0]?.values[column.id] || "—";

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
    <Modal.Dialog aria-label="Разбиение по символу">
      <Modal.CloseTrigger onPress={onClose} />
      <Modal.Header className="mb-2">
        <div>
          <h2 className="mb-1 text-2xl font-semibold">Разбиение по символу</h2>
          <p className="text-gray-600">Колонка: {column.label}</p>
        </div>
      </Modal.Header>
      <ModalHeader
        title="Извлечение чисел"
        columnName={column.label}
        icon={Scissors}
      />
      <ModalBody>
        <SourceValues
          title="Пример исходного значения"
          values={[sourceValue]}
        />

        <div className="flex flex-col gap-1">
          <Label htmlFor="select-separator" className="text-lg font-medium">
            Выберите разделитель:
          </Label>
          <AppSelect
            id="select-separator"
            items={separators}
            getItemKey={(s) => s.key}
            getItemLabel={(s) => s.label}
            variant="secondary"
            onChange={handleSelectSeparator}
          />
          <Label htmlFor="select-input" className="text-lg font-medium">
            Или введите свой символ:
          </Label>
          <Input
            id="select-input"
            placeholder="Введите символ..."
            variant="secondary"
            onChange={(e) => handleSelectSeparator(e.target.value)}
          />
        </div>

        <Mapping
          values={splitted ?? []}
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
