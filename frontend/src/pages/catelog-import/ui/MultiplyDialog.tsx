import { useState } from "react";
import { Button, Label, Modal, Tabs, toast, type Key } from "@heroui/react";
import { Calculator } from "lucide-react";
import {
  MappingTargetType,
  MAX_PRECISION,
  OperationType,
  PrevActionType,
  TransformType,
  type MappingTarget,
} from "@engineering-data-normalizer/shared";
import { ModalHeader } from "./ModalHeader";
import { ModalBody } from "./ModalBody";
import { useTransformationContextStore } from "../model/store";
import type { TransformationDialogProps } from "../model/types";
import { useApplyTransformMutation } from "@/features/import";
import { AppNumberField, AppSelect } from "@/shared/ui";

const MIN_SANE_VALUE = Math.pow(10, -MAX_PRECISION);

export const MultiplyDialog = ({
  column,
  attributes,
  sessionId,
  onClose,
}: TransformationDialogProps) => {
  const setNormalizationContext = useTransformationContextStore(
    (s) => s.setNormalizationContext,
  );

  const [operation, setOperation] = useState<OperationType>(
    OperationType.MULTIPLY,
  );
  const [value, setValue] = useState(1);
  const [target, setTarget] = useState<MappingTarget | null>(null);

  const modalTitle =
    operation === OperationType.MULTIPLY ? "Умножение" : "Деление";

  const applyTransformMutation = useApplyTransformMutation();

  const handleSelectAttribute = (value: Key | null) => {
    if (!value) return;

    const selectedAttr = attributes.find((attr) => attr.id === String(value));
    if (!selectedAttr) return;

    const newTarget =
      selectedAttr.type === MappingTargetType.ATTRIBUTE
        ? {
            type: selectedAttr.type,
            id: String(value),
          }
        : { type: selectedAttr.type, field: selectedAttr.id as any };

    setTarget(newTarget);
  };

  const handleApply = () => {
    if (value === 0) {
      const operand =
        operation === OperationType.MULTIPLY ? "Множитель" : "Делитель";
      return toast.danger(`${operand} не может быть равен нулю`);
    }

    if (!target) {
      return toast.danger("Выберите атрибут");
    }

    const payload = {
      sessionId,
      colIndex: column.originIndex,
      subIndex: column.subIndex,
      transform: {
        type: TransformType.MULTIPLY,
        payload: { operation, value },
      },
      targets: [target],
    };

    console.log(payload);

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
    <Modal.Dialog aria-label={modalTitle}>
      <Modal.CloseTrigger onPress={onClose} />
      <ModalHeader
        title={modalTitle}
        columnName={
          column.unit ? `${column.label} (${column.unit})` : column.label
        }
        icon={Calculator}
      />
      <ModalBody>
        <div className="flex flex-col gap-2">
          <Label className="text-lg font-medium">Операция:</Label>
          <Tabs
            selectedKey={operation}
            onSelectionChange={(key) => setOperation(key as OperationType)}
          >
            <Tabs.ListContainer>
              <Tabs.List aria-label="Операция">
                <Tabs.Tab id={OperationType.MULTIPLY}>
                  Умножение
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id={OperationType.DIVIDE}>
                  Деление
                  <Tabs.Indicator />
                </Tabs.Tab>
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>

        <Label htmlFor="factor-input" className="text-lg font-medium">
          {operation === OperationType.MULTIPLY ? "Множитель" : "Делитель"}
        </Label>
        <AppNumberField
          id="factor-input"
          placeholder="100"
          value={value}
          onChange={setValue}
          variant="secondary"
          minValue={MIN_SANE_VALUE}
          formatOptions={{
            minimumFractionDigits: 0,
            maximumFractionDigits: MAX_PRECISION,
          }}
        />

        <Label htmlFor="select-attr" className="text-lg font-medium">
          Выберите атрибут:
        </Label>
        <AppSelect
          id="select-attr"
          items={attributes}
          getItemKey={(attr) => attr.id}
          getItemLabel={(attr) =>
            attr.unit ? `${attr.label} (${attr.unit})` : attr.label
          }
          variant="secondary"
          className="w-full"
          placeholder="Выберите атрибут..."
          onChange={handleSelectAttribute}
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
