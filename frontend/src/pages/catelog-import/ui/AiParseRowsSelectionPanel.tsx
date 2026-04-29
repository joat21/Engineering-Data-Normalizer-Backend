import { Button, Card, cn } from "@heroui/react";
import {
  useSelectionStore,
  useTransformationContextStore,
} from "../model/store";
import { TransformationType } from "../model/types";

export const AiParseRowsSelectionPanel = () => {
  const trnasformationContext = useTransformationContextStore(
    (s) => s.activeContext,
  );
  const setTransformationContext = useTransformationContextStore(
    (s) => s.setContext,
  );
  const isSelecting = useSelectionStore((s) => s.activeContext === "ai_parse");
  const setSelectionContext = useSelectionStore((s) => s.setContext);
  const count = useSelectionStore((s) => s.count);

  if (!isSelecting) return null;

  const handleCancel = () => {
    setSelectionContext(null);
    setTransformationContext(null);
    useSelectionStore.getState().clear();
  };
  const handleContinue = () => {
    if (trnasformationContext?.type !== TransformationType.AI_PARSE) return;
    setTransformationContext({
      ...trnasformationContext,
      step: "CONFIG_MODAL",
    });
  };

  return (
    <Card
      className={cn(
        "fixed bottom-12 left-1/2 flex-row gap-6 items-center px-6 py-3 max-w-[90vh] w-fit",
        "border-none backdrop-blur-xl ring-1 ring-accent/10 -translate-x-1/2 shadow-2xl",
      )}
    >
      <div className="flex flex-col">
        <span className="text-lg font-semibold">Тестовая выборка</span>
        <span>
          Выберите от 2 до 5 строк для калибровки ИИ:{" "}
          <b className="whitespace-nowrap">{count} / 5</b>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          onPress={handleCancel}
          className="font-medium"
          variant="outline"
        >
          Отмена
        </Button>
        <Button
          isDisabled={count < 2}
          onPress={handleContinue}
          className="font-bold px-6"
        >
          Продолжить
        </Button>
      </div>
    </Card>
  );
};
