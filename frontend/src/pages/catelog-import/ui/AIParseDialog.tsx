import { useMemo, useState } from "react";
import { Button, Checkbox, Chip, cn, Input, Modal, toast } from "@heroui/react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Info,
  Play,
  Save,
  WandSparkles,
  Zap,
} from "lucide-react";
import {
  MappingTargetType,
  PrevActionType,
  type AiParseColumnResult,
  type CategoryAttribute,
} from "@engineering-data-normalizer/shared";
import { useTransformationContextStore } from "../model/store";
import type { TransformationDialogProps } from "../model/types";
import {
  useApplyAiParseMutation,
  useEditAiParseResultsMutation,
  useSaveAiParseResultsMutation,
} from "@/features/import";
import { ModalHeader } from "./ModalHeader";
import { ModalBody } from "./ModalBody";
import { ModalLoader } from "./ModalLoader";

type Status = "PENDING" | "TESTED" | "PARSED_ALL";

interface AIParseDialogProps extends TransformationDialogProps {
  selectedRowIds: Record<string, boolean>;
}

export const AIParseDialog = ({
  column,
  rows,
  attributes,
  sessionId,
  onClose,
  selectedRowIds,
}: AIParseDialogProps) => {
  const setNormalizationContext = useTransformationContextStore(
    (s) => s.setNormalizationContext,
  );
  const [status, setStatus] = useState<Status>("PENDING");
  const [selectedAttrIds, setSelectedAttrIds] = useState<string[]>([]);
  const [parsingSessionId, setParsingSessionId] = useState<string | null>(null);
  const [parsingResult, setParsingResult] =
    useState<AiParseColumnResult | null>(null);

  const [edits, setEdits] = useState<Record<string, string>>({});

  const applyAiParseMutation = useApplyAiParseMutation();
  const saveAiParseResultsMutation = useSaveAiParseResultsMutation();
  const editAiParseResultsMutation = useEditAiParseResultsMutation();

  const selectedValues = useMemo(
    () =>
      rows
        .filter((row) => !!selectedRowIds[row.id])
        .map((row) => row.values[column.id]),
    [rows, selectedRowIds],
  );

  const handleSelectAttribute = (
    isSelected: boolean,
    attr: CategoryAttribute,
  ) => {
    setSelectedAttrIds((prevIds) => {
      let newIds = prevIds;

      if (!isSelected) {
        newIds = prevIds.filter((id) => id !== attr.id);
      } else {
        newIds.push(attr.id);
      }

      return newIds;
    });
  };

  const handleTestParse = () => {
    const targets = attributes
      .filter((attr) => selectedAttrIds.includes(attr.id))
      .map((attr) => ({ type: attr.type, key: attr.key, label: attr.label }));

    const notNullTargets = targets.filter((t) => t != null);
    if (notNullTargets.length === 0) {
      return toast.danger("Выберите хотя бы один атрибут");
    }

    const payload = {
      importSessionId: sessionId,
      colIndex: column.originIndex,
      subIndex: column.subIndex,
      testRowIds: Object.keys(selectedRowIds),
      targets,
    };

    applyAiParseMutation.mutate(payload, {
      onSuccess: (data) => {
        setStatus("TESTED");
        setParsingSessionId(data.parsingSessionId);
        setParsingResult(data);
      },
    });
  };

  const handleParseAll = () => {
    if (!parsingSessionId) return;

    const targets = attributes
      .filter((attr) => selectedAttrIds.includes(attr.id))
      .map((attr) => ({ type: attr.type, key: attr.key, label: attr.label }));

    const notNullTargets = targets.filter((t) => t != null);
    if (notNullTargets.length === 0) {
      return toast.danger("Выберите хотя бы один атрибут");
    }

    const payload = {
      importSessionId: sessionId,
      parsingSessionId,
      colIndex: column.originIndex,
      subIndex: column.subIndex,
      testRowIds: Object.keys(selectedRowIds),
      targets,
    };

    applyAiParseMutation.mutate(payload, {
      onSuccess: (data) => {
        setStatus("PARSED_ALL");
        setParsingResult(data);
      },
    });
  };

  const handleApply = () => {
    if (!parsingSessionId) return;

    const targets = attributes
      .filter((attr) => selectedAttrIds.includes(attr.id))
      .map((attr) => {
        if (attr.type === MappingTargetType.ATTRIBUTE) {
          return { type: attr.type, id: attr.id };
        } else {
          return { type: attr.type, field: attr.key as any };
        }
      });

    const payload = {
      importSessionId: sessionId,
      sessionId: parsingSessionId,
      sourceColIndex: column.originIndex,
      subIndex: column.subIndex,
      targets,
    };

    saveAiParseResultsMutation.mutate(payload, {
      onSuccess: (data, variables) => {
        if (data.issues.length > 0) {
          setNormalizationContext({
            issues: data.issues,
            metadata: {
              sessionId: variables.importSessionId,
              colIndex: variables.sourceColIndex,
              targets: variables.targets,
              prevActionType: PrevActionType.DIRECT,
            },
          });
        }
        onClose();
      },
    });
  };

  const handleCellEdit = (rowId: string, targetKey: string, value: string) => {
    setEdits((prev) => ({
      ...prev,
      [`${rowId}:${targetKey}`]: value,
    }));
  };

  const handleSaveEdits = () => {
    if (!parsingSessionId) return;

    const editedValues = Object.entries(edits).map(([key, value]) => {
      const [sourceItemId, targetKey] = key.split(":");
      return {
        sourceItemId,
        targetKey: targetKey as any,
        newRawValue: value,
      };
    });

    editAiParseResultsMutation.mutate(
      {
        sessionId: parsingSessionId,
        editedValues,
      },
      {
        onSuccess: () => {
          setParsingResult((prev) => {
            if (!prev) return prev;

            return {
              ...prev,
              rows: prev.rows.map((row) => {
                const currentEntries = editedValues.filter(
                  (e) => e.sourceItemId === row.id,
                );
                if (currentEntries.length === 0) return row;

                const newValues = [...row.values];

                currentEntries.forEach((entry) => {
                  const colIndex = prev.headers.findIndex(
                    (h) => h.key === entry.targetKey,
                  );

                  // в headers есть еще колонка sourceString, поэтому делаем -1
                  // (при рендере строк делали +1)
                  // (костыль)
                  const valuesIndex = colIndex - 1;

                  if (valuesIndex >= 0) {
                    newValues[valuesIndex] = entry.newRawValue;
                  }
                });

                return { ...row, values: newValues };
              }),
            };
          });

          setEdits({});
        },
      },
    );
  };

  return (
    <Modal.Dialog
      aria-label="ИИ-анализ"
      className="max-w-[90vw] w-300 max-h-[90vh] flex flex-col"
    >
      <ModalLoader
        isLoading={
          applyAiParseMutation.isPending ||
          editAiParseResultsMutation.isPending ||
          saveAiParseResultsMutation.isPending
        }
      />
      <Modal.CloseTrigger onPress={onClose} />
      <ModalHeader
        title="Интеллектуальный анализ (ИИ)"
        columnName={column.label}
        icon={WandSparkles}
      />

      <ModalBody className="flex-1 overflow-y-auto gap-8">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-4">
          <div className="bg-blue-500 text-white p-2 rounded-lg h-fit">
            <Info size={20} />
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-bold text-blue-900">Как это работает?</span>
            <ol className="text-sm text-blue-800/80 list-decimal ml-4 flex flex-col gap-1">
              <li>
                Выберите <b>характеристики</b>, которые ИИ должен найти в
                тексте.
              </li>
              <li>
                Запустите <b>тестовый анализ</b> на выбранных примерах (
                {selectedValues.length} шт).
              </li>
              <li>
                Проверьте результат и при необходимости <b>внесите правки</b>{" "}
                прямо в таблицу.
              </li>
              <li>
                Если всё ок — примените ко <b>всем строкам</b> в файле.
              </li>
            </ol>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-base font-semibold uppercase">
            Примеры данных для теста
          </span>
          <div className="flex flex-wrap gap-2">
            {selectedValues.map((val, i) => (
              <div
                key={i}
                className="px-3 py-1 bg-default-100 rounded-full text-sm font-mono text-default-600 border border-default-200"
              >
                {val}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <span className="font-semibold">
            Выберите характеристики для извлечения
          </span>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {attributes.map((attr) => (
              <label
                key={attr.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer bg-white",
                  "hover:bg-accent/5 hover:border-accent/50",
                )}
              >
                <Checkbox
                  key={attr.id}
                  name={attr.key}
                  onChange={(isSelected) =>
                    handleSelectAttribute(isSelected, attr)
                  }
                  variant="secondary"
                >
                  <Checkbox.Control>
                    <Checkbox.Indicator />
                  </Checkbox.Control>
                  <Checkbox.Content>
                    <span className="text-sm font-medium select-none">
                      {attr.label}
                    </span>
                  </Checkbox.Content>
                </Checkbox>
              </label>
            ))}
          </div>
        </div>

        {parsingResult && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 font-bold text-success">
                <CheckCircle2 />{" "}
                {status === "TESTED" && "Результаты тестового анализа"}
                {status === "PARSED_ALL" && "Результаты анализа всех строк"}
              </span>
              {Object.keys(edits).length > 0 && (
                <Chip
                  color="warning"
                  className="flex gap-1 p-1 text-base bg-transparent"
                >
                  <AlertCircle />
                  Есть несохраненные правки
                </Chip>
              )}
            </div>
            <div className="border rounded-2xl shadow-sm bg-white overflow-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    {parsingResult.headers.map((h) => (
                      <th
                        key={h.key}
                        className="p-3 text-left text-xs font-bold uppercase"
                      >
                        {h.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {parsingResult.rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3 text-base font-mono text-default-500 bg-default-50/50 w-[30%]">
                        {row.sourceString}
                      </td>
                      {row.values.map((v, i) => {
                        const targetKey = parsingResult.headers[i + 1].key;
                        const cellKey = `${row.id}:${targetKey}`;
                        let displayValue = v === "null" ? "" : v;

                        if (edits[cellKey]) {
                          displayValue = edits[cellKey];
                        }

                        const isEdited = !!edits[cellKey];

                        return (
                          <td key={i} className="p-2">
                            <Input
                              value={displayValue}
                              onChange={(e) =>
                                handleCellEdit(
                                  row.id,
                                  targetKey,
                                  e.target.value,
                                )
                              }
                              variant="secondary"
                              className={cn(
                                "min-w-30 transition-all",
                                isEdited &&
                                  "ring-2 ring-blue-500 border-blue-500",
                              )}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ModalBody>

      <Modal.Footer className="p-4 border-t">
        <div className="flex justify-between w-full items-center">
          <Button variant="outline" onPress={onClose}>
            Отмена
          </Button>

          <div className="flex items-center gap-3">
            {Object.keys(edits).length > 0 && (
              <Button variant="secondary" onPress={handleSaveEdits}>
                <Save />
                Сохранить правки
              </Button>
            )}

            {status === "PENDING" && (
              <Button className="font-bold px-8" onPress={handleTestParse}>
                <Play fill="currentColor" />
                Запустить тест
              </Button>
            )}

            {status === "TESTED" && (
              <Button
                className="font-bold px-8 bg-purple-500"
                onPress={handleParseAll}
              >
                <Zap fill="currentColor" />
                Обработать всю колонку
              </Button>
            )}

            {status === "PARSED_ALL" && (
              <Button
                className="font-bold px-8 bg-success"
                onPress={handleApply}
              >
                <Check strokeWidth={3} />
                Подтвердить и применить
              </Button>
            )}
          </div>
        </div>
      </Modal.Footer>
    </Modal.Dialog>
  );
};
