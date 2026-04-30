import {
  TransformType,
  type CategoryAttribute,
  type StagingColumn,
  type StagingRow,
} from "@engineering-data-normalizer/shared";

export const SelectionMode = {
  HEADER: "header",
  BODY: "body",
};

export type SelectionMode = (typeof SelectionMode)[keyof typeof SelectionMode];

export interface SelectionRange {
  start: CellCoords;
  end: CellCoords;
}

interface CellCoords {
  r: number;
  c: number;
}

export type TransformationContext =
  | { type: typeof TransformationType.EXTRACT_NUMBERS; column: StagingColumn }
  | { type: typeof TransformationType.SPLIT_BY; column: StagingColumn }
  | { type: typeof TransformationType.MULTIPLY; column: StagingColumn }
  | {
      type: typeof TransformationType.AI_PARSE;
      column: StagingColumn;
      step: "SELECTING_ROWS" | "CONFIG_MODAL";
    };

export const TransformationType = {
  ...TransformType,
  AI_PARSE: "AI_PARSE",
} as const;

export type TransformationType =
  (typeof TransformationType)[keyof typeof TransformationType];

// если понадобятся еще действия, то лучше их вынести в отдельный тип,
// а потом делать юнион
export type TableActionKey = TransformationType | "reset-col";

export interface TransformationDialogProps {
  attributes: CategoryAttribute[];
  column: StagingColumn;
  rows: StagingRow[];
  sessionId: string;
  onClose: () => void;
}
