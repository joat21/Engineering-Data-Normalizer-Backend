import { useEffect, useState } from "react";
import {
  Button,
  ButtonGroup,
  Card,
  Chip,
  Tabs,
  toast,
  Tooltip,
} from "@heroui/react";
import { cn } from "@heroui/styles";
import * as XLSX from "xlsx";
import { ArrowRight, LayoutGrid, RotateCcw, Table } from "lucide-react";
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
import { PageLoader } from "@/shared/ui";

interface InitTableProps {
  categoryId: string;
}

export const InitTable = ({ categoryId }: InitTableProps) => {
  const initImportMutation = useInitImportMutation();
  const importRowsMutation = useImportRowsMutation();

  const file = useImportStore((s) => s.file);
  const setSessionId = useImportStore((s) => s.setSessionId);
  const setStep = useImportStore((s) => s.setStep);
  const manufacturerId = useImportStore((s) => s.manufacturerId);
  const supplierId = useImportStore((s) => s.supplierId);

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

  const handleInitTable = async () => {
    if (!headerRange || !bodyRange || !file) return;

    const { headers, body } = extractTableData(data, headerRange, bodyRange);

    if (headers.length !== body[0].length) {
      return toast.danger(
        "Шапка и данные должны содержать одинаковое количество колонок",
      );
    }

    try {
      const { sessionId } = await initImportMutation.mutateAsync({
        file,
        categoryId,
        sourceType: SourceType.CATALOG,
        originHeader: headers,
        manufacturerId: manufacturerId!,
        supplierId: supplierId!,
      });

      setSessionId(sessionId);

      importRowsMutation.mutate(
        { sessionId, rows: body },
        { onSuccess: () => setStep(CatalogImportStep.MAP_COLUMNS) },
      );
    } catch (error) {
      console.error(error);
    }
  };

  if (!file) return <div>Файл не найден в сторе. Вернитесь на шаг назад.</div>;
  if (isLoading) return <PageLoader />;

  return (
    <>
      {/* h-[calc(100dvh-48px)] - здесь 48px = суммарный вертикальный паддинг обертки из MainLayout */}
      <div className="flex flex-col gap-4 w-full h-[calc(100dvh-48px)]">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold">Инициализация импорта</h1>
          <p>
            Выделите области в таблице: сначала строку заголовков, затем
            диапазон с данными. Это поможет системе корректно распознать
            характеристики оборудования.
          </p>
        </div>

        <Card className="flex flex-row justify-between shrink-0 p-4 rounded-xl">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <ButtonGroup variant="outline">
                <Button
                  className={cn(
                    mode === SelectionMode.HEADER && "bg-accent-soft",
                  )}
                  onPress={() => setMode(SelectionMode.HEADER)}
                >
                  <Table />
                  1. Шапка
                </Button>

                <Button
                  onPress={() => setMode(SelectionMode.BODY)}
                  className={cn(
                    mode === SelectionMode.BODY && "bg-success-soft",
                  )}
                >
                  <LayoutGrid />
                  2. Данные
                </Button>
              </ButtonGroup>

              <Tooltip delay={0} closeDelay={0}>
                <Tooltip.Trigger>
                  <Button
                    isIconOnly
                    variant="danger-soft"
                    onPress={() => {
                      setHeaderRange(null);
                      setBodyRange(null);
                    }}
                  >
                    <RotateCcw />
                  </Button>
                </Tooltip.Trigger>
                <Tooltip.Content>Сбросить все выделение</Tooltip.Content>
              </Tooltip>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <Chip
                className={cn(
                  "px-4 py-1 text-base",
                  headerRange && "bg-blue-200",
                )}
              >
                Шапка: {headerRange ? "Выбрана" : "—"}
              </Chip>
              <Chip
                className={cn(
                  "px-4 py-1 text-base",
                  bodyRange && "bg-emerald-200",
                )}
              >
                Данные: {bodyRange ? "Выбраны" : "—"}
              </Chip>
            </div>

            <Button
              size="lg"
              className="font-semibold px-8"
              onPress={handleInitTable}
              isDisabled={!headerRange || !bodyRange}
            >
              Продолжить
              <ArrowRight />
            </Button>
          </div>
        </Card>

        <div className="flex flex-col flex-1 rounded-xl overflow-hidden">
          <div
            className="flex-1 border border-b-0 rounded-br-none rounded-bl-none rounded-xl overflow-auto"
            onMouseLeave={handleMouseUp}
          >
            <table className="w-full border-collapse select-none cursor-crosshair">
              <tbody className="divide-y">
                {data.map((row, r) => (
                  <tr key={r}>
                    {row.some((c) => !!c) &&
                      row.map((cell, c) => (
                        <td
                          key={c}
                          className={cn(
                            "border p-2 min-w-30 max-w-62.5 truncate transition-colors",
                            getCellClass(
                              r,
                              c,
                              tempRange,
                              headerRange,
                              bodyRange,
                            ),
                          )}
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

          <Tabs
            className="border-2 border-b rounded-b-xl bg-white overflow-auto"
            variant="secondary"
            selectedKey={activeSheet}
            onSelectionChange={(key) => setActiveSheet(key as string)}
            aria-label="Excel Sheets"
          >
            <Tabs.ListContainer className="w-fit">
              <Tabs.List aria-label="Excel Sheets">
                {workbook?.SheetNames.slice().map((name) => (
                  <Tabs.Tab
                    key={name}
                    id={name}
                    className={cn(
                      "whitespace-nowrap",
                      activeSheet === name && "bg-accent/5",
                    )}
                  >
                    {name}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.ListContainer>
          </Tabs>
        </div>
      </div>
    </>
  );
};
