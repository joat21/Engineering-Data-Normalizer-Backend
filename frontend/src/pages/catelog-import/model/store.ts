import { create } from "zustand";
import { TransformationType, type TransformationContext } from "./types";
import type {
  MappingTarget,
  NormalizationIssue,
  PrevActionType,
  TransformConfig,
} from "@engineering-data-normalizer/shared";

interface SelectionStore {
  selectedRowIds: Record<string, boolean>;
  count: number;
  toggleRow: (id: string) => void;
  clear: () => void;
}

export const useSelectionStore = create<SelectionStore>((set) => ({
  selectedRowIds: {},
  count: 0,

  toggleRow: (id) =>
    set((state) => {
      const isSelected = !!state.selectedRowIds[id];

      if (!isSelected && state.count >= 5) return state;

      return {
        selectedRowIds: {
          ...state.selectedRowIds,
          [id]: !isSelected,
        },
        count: isSelected ? state.count - 1 : state.count + 1,
      };
    }),

  clear: () => set({ selectedRowIds: {}, count: 0 }),
}));

interface NormalizationContext {
  issues: NormalizationIssue[];
  metadata: {
    sessionId: string;
    colIndex: number;
    targets: (MappingTarget | null)[];
    prevActionType: PrevActionType;
    transform?: TransformConfig;
    parsingSessionId?: string;
  };
}

interface TransformationContextStore {
  activeContext: TransformationContext | null;
  setContext: (context: TransformationContext | null) => void;
  isSelecting: boolean;
  normalizationContext: NormalizationContext | null;
  setNormalizationContext: (context: NormalizationContext | null) => void;
}

export const useTransformationContextStore = create<TransformationContextStore>(
  (set) => ({
    isSelecting: false,
    activeContext: null,
    setContext: (context) =>
      set({
        activeContext: context,
        isSelecting: context?.type === TransformationType.AI_PARSE,
      }),
    normalizationContext: null,
    setNormalizationContext: (context) =>
      set({ normalizationContext: context }),
  }),
);
