import { Modal } from "@heroui/react";
import type {
  CategoryAttribute,
  StagingRow,
} from "@engineering-data-normalizer/shared";
import { TransformationType, type TransformationContext } from "../model/types";
import { AIParseDialog } from "./AIParseDialog";
import { ExtractNumbersDialog } from "./ExtractNumbersDialog";
import { SplitByDialog } from "./SplitByDialog";
import {
  useSelectionStore,
  useTransformationContextStore,
} from "../model/store";
import { MultiplyDialog } from "./MultiplyDialog";

interface TransformModalManagerProps {
  rows: StagingRow[];
  attributes: CategoryAttribute[];
  sessionId: string;
}

export const TransformModalManager = ({
  rows,
  attributes,
  sessionId,
}: TransformModalManagerProps) => {
  const setIsSelecting = useSelectionStore((s) => s.setIsSelecting);
  const activeContext = useTransformationContextStore((s) => s.activeContext);
  const setContext = useTransformationContextStore((s) => s.setContext);

  const handleClose = () => {
    setIsSelecting(false);
    setContext(null);
  };

  let isOpen = false;
  if (activeContext?.type === TransformationType.AI_PARSE) {
    isOpen = activeContext.step === "CONFIG_MODAL";
  } else {
    isOpen = activeContext !== null;
  }

  return (
    <Modal.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => !open && handleClose()}
    >
      <Modal.Container>
        {isOpen && (
          <ModalContentRouter
            activeContext={activeContext}
            rows={rows}
            attributes={attributes}
            sessionId={sessionId}
            onClose={handleClose}
          />
        )}
      </Modal.Container>
    </Modal.Backdrop>
  );
};

const ModalContentRouter = ({
  activeContext,
  ...props
}: TransformModalManagerProps & {
  activeContext: TransformationContext | null;
  onClose: () => void;
}) => {
  if (!activeContext) return;

  const selectedRowIds = useSelectionStore((s) => s.selectedRowIds);
  const type = activeContext.type;

  switch (type) {
    case TransformationType.EXTRACT_NUMBERS:
      return <ExtractNumbersDialog column={activeContext.column} {...props} />;

    case TransformationType.SPLIT_BY:
      return <SplitByDialog column={activeContext.column} {...props} />;

    case TransformationType.MULTIPLY:
      return <MultiplyDialog column={activeContext.column} {...props} />;

    case TransformationType.AI_PARSE:
      if (activeContext.step === "CONFIG_MODAL") {
        return (
          <AIParseDialog
            column={activeContext.column}
            selectedRowIds={selectedRowIds}
            {...props}
          />
        );
      }

      return;

    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
};
