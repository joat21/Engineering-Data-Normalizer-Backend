import * as XLSX from "xlsx";
import {
  useImportRowsMutation,
  useImportStore,
  useInitImportMutation,
} from "@/features/import";
import { useEffect, useState } from "react";
import { cn } from "@heroui/styles";
import { Button } from "@heroui/react";
import { SourceType } from "@engineering-data-normalizer/shared";

type CellCoords = { r: number; c: number };
export type SelectionType = "header" | "body" | null;
export interface AreaSelection {
  type: SelectionType;
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

type SelectionRange = { start: CellCoords; end: CellCoords } | null;

interface InitTableProps {
  categoryId: string;
}

export const InitTable = ({ categoryId }: InitTableProps) => {
  const initImportMutation = useInitImportMutation();
  const importRowsMutation = useImportRowsMutation();

  const { file } = useImportStore();
  const [data, setData] = useState<any[][]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [headerRange, setHeaderRange] = useState<SelectionRange>(null);
  const [bodyRange, setBodyRange] = useState<SelectionRange>(null);
  const [tempRange, setTempRange] = useState<SelectionRange>(null);

  const [mode, setMode] = useState<"header" | "body">("header");
  const [isDragging, setIsDragging] = useState(false);

  const isInRange = (r: number, c: number, range: SelectionRange) => {
    if (!range) return false;
    const minR = Math.min(range.start.r, range.end.r);
    const maxR = Math.max(range.start.r, range.end.r);
    const minC = Math.min(range.start.c, range.end.c);
    const maxC = Math.max(range.start.c, range.end.c);
    return r >= minR && r <= maxR && c >= minC && c <= maxC;
  };

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

    if (mode === "header") {
      setHeaderRange(tempRange);
    } else {
      setBodyRange(tempRange);
    }

    setTempRange(null);
    setIsDragging(false);
  };

  const getCellClass = (r: number, c: number) => {
    if (isInRange(r, c, tempRange)) return "bg-primary-200 border-primary-400";

    if (isInRange(r, c, headerRange))
      return "bg-blue-200 border-blue-500 opacity-80";

    if (isInRange(r, c, bodyRange))
      return "bg-emerald-200 border-emerald-500 opacity-80";

    return "bg-white border-gray-200";
  };

  useEffect(() => {
    if (!file) return;

    const parseFile = async () => {
      setIsLoading(true);
      try {
        const reader = new FileReader();

        reader.onload = (event) => {
          const arrayBuffer = event.target?.result;

          const workBook = XLSX.read(arrayBuffer, { type: "array" });
          const wsName = workBook.SheetNames[0];
          const workSheet = workBook.Sheets[wsName];

          const jsonData = XLSX.utils.sheet_to_json(workSheet, {
            header: 1,
          }) as any[][];

          const maxCols = Math.max(...jsonData.map((row) => row.length), 0);
          const normalizedData = jsonData.map((row) =>
            Array.from({ length: maxCols }, (_, i) => row[i] ?? ""),
          );

          setData(normalizedData);
          setIsLoading(false);
        };

        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error("Ошибка при парсинге файла:", error);
        setIsLoading(false);
      }
    };

    parseFile();
  }, [file]);

  const getSubMatrix = (matrix: any[][], range: SelectionRange) => {
    if (!range) return [];

    // 1. Находим реальные границы (нормализация)
    const rStart = Math.min(range.start.r, range.end.r);
    const rEnd = Math.max(range.start.r, range.end.r);
    const cStart = Math.min(range.start.c, range.end.c);
    const cEnd = Math.max(range.start.c, range.end.c);

    // 2. Сначала берем нужные строки, потом в каждой строке берем нужные колонки
    return matrix
      .slice(rStart, rEnd + 1) // Берем строки [от, до]
      .map((row) => row.slice(cStart, cEnd + 1)); // В каждой строке берем колонки [от, до]
  };

  const handleConfirmSelection = async () => {
    if (!headerRange || !bodyRange || !file) {
      return;
    }

    // Извлекаем "сырые" матрицы
    const rawHeader = getSubMatrix(data, headerRange);
    const rawBody = getSubMatrix(data, bodyRange);

    const headerStrings: string[] = rawHeader[0].map((_, colIndex) => {
      return rawHeader
        .map((row) => String(row[colIndex] || "").trim())
        .filter(Boolean)
        .join(" ");
    });

    const bodyData: string[][] = rawBody.map((row) =>
      row.map((cell) => String(cell ?? "").trim()),
    );

    console.log("Headers:", headerStrings);
    console.log("Body:", bodyData);

    const { sessionId } = await initImportMutation.mutateAsync({
      file,
      categoryId,
      sourceType: SourceType.CATALOG,
      originHeader: headerStrings,
    });

    importRowsMutation.mutate(
      { sessionId, rows: bodyData },
      { onSuccess: () => alert("Данные загружены") },
    );
  };

  if (!file) return <div>Файл не найден в сторе. Вернитесь на шаг назад.</div>;
  if (isLoading) return <div>Парсинг таблицы...</div>;

  return (
    <div className="flex flex-col gap-4">
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
                      className={`border p-2 transition-colors ${getCellClass(r, c)}`}
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
