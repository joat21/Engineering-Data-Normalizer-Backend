import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import { cn } from "@heroui/styles";
import * as XLSX from "xlsx";
import { SourceType } from "@engineering-data-normalizer/shared";
import { SelectionMode, type SelectionRange } from "../model/types";
import {
  extractTableData,
  getCellClass,
  getWorkbook,
  parseSheet,
} from "../model/utils";
import {
  CatalogImportStep,
  useImportRowsMutation,
  useImportStore,
  useInitImportMutation,
} from "@/features/import";

interface InitTableProps {
  categoryId: string;
}

export const InitTable = ({ categoryId }: InitTableProps) => {
  const initImportMutation = useInitImportMutation();
  const importRowsMutation = useImportRowsMutation();

  const file = useImportStore((s) => s.file);
  const setSessionId = useImportStore((s) => s.setSessionId);
  const setStep = useImportStore((s) => s.setStep);
  const [data, setData] = useState<any[][]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [headerRange, setHeaderRange] = useState<SelectionRange | null>(null);
  const [bodyRange, setBodyRange] = useState<SelectionRange | null>(null);
  const [tempRange, setTempRange] = useState<SelectionRange | null>(null);

  const [mode, setMode] = useState<SelectionMode>(SelectionMode.HEADER);
  const [isDragging, setIsDragging] = useState(false);

  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>("");

  const handleMouseDown = (r: number, c: number) => {
    setIsDragging(true);
    setTempRange({ start: { r, c }, end: { r, c } });
  };

  const handleMouseEnter = (r: number, c: number) => {
    if (!isDragging || !tempRange) return;
    setTempRange({ ...tempRange, end: { r, c } });
  };

  const handleMouseUp = () => {
    if (!tempRange) return;

    if (mode === SelectionMode.HEADER) {
      setHeaderRange(tempRange);
    } else {
      setBodyRange(tempRange);
    }

    setTempRange(null);
    setIsDragging(false);
  };

  useEffect(() => {
    if (!file) return;

    const load = async () => {
      setIsLoading(true);
      try {
        const wb = await getWorkbook(file);
        setWorkbook(wb);
        setActiveSheet(wb.SheetNames[0]);
      } catch (e) {
        console.error("Ошибка чтения файла", e);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [file]);

  useEffect(() => {
    if (!workbook || !activeSheet) return;

    const sheetData = parseSheet(workbook, activeSheet);
    setData(sheetData);
  }, [workbook, activeSheet]);

  const handleConfirmSelection = async () => {
    if (!headerRange || !bodyRange || !file) return;

    const { headers, body } = extractTableData(data, headerRange, bodyRange);

    try {
      const { sessionId } = await initImportMutation.mutateAsync({
        file,
        categoryId,
        sourceType: SourceType.CATALOG,
        originHeader: headers,
      });

      setSessionId(sessionId);

      importRowsMutation.mutate(
        { sessionId, rows: body },
        { onSuccess: () => setStep(CatalogImportStep.MAP_COLUMNS) },
      );
    } catch (error) {
      alert("Не удалось инициализировать импорт");
      console.error(error);
    }
  };

  if (!file) return <div>Файл не найден в сторе. Вернитесь на шаг назад.</div>;
  if (isLoading) return <div>Парсинг таблицы...</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 p-2 bg-default-100 rounded-lg">
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {workbook?.SheetNames.map((name) => (
            <Button key={name} onPress={() => setActiveSheet(name)}>
              {name}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 p-2 bg-default-100 rounded-lg">
        <Button
          onPress={() => setMode("header")}
          className={cn(
            mode === "header"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200",
          )}
        >
          1. Выделить шапку
        </Button>
        <Button
          onPress={() => setMode("body")}
          className={cn(
            mode === "body"
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200",
          )}
        >
          2. Выделить данные
        </Button>
        <Button
          onPress={() => {
            setHeaderRange(null);
            setBodyRange(null);
          }}
        >
          Сбросить всё
        </Button>
        <Button
          onPress={handleConfirmSelection}
          isDisabled={!headerRange || !bodyRange}
        >
          Продолжить
        </Button>
      </div>

      <div
        className="overflow-auto border rounded-xl"
        onMouseLeave={handleMouseUp}
      >
        <table className="select-none cursor-crosshair">
          <tbody>
            {data.map((row, r) => (
              <tr key={r}>
                {row.some((c) => !!c) &&
                  row.map((cell, c) => (
                    <td
                      key={c}
                      className={`border p-2 transition-colors ${getCellClass(r, c, tempRange, headerRange, bodyRange)}`}
                      onMouseDown={() => handleMouseDown(r, c)}
                      onMouseEnter={() => handleMouseEnter(r, c)}
                      onMouseUp={handleMouseUp}
                    >
                      {String(cell)}
                    </td>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
