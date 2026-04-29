import { create } from "zustand";
import { type TransformationContext } from "./types";
import type {
  MappingTarget,
  NormalizationIssue,
  PrevActionType,
  TransformConfig,
} from "@engineering-data-normalizer/shared";

interface SelectionStore {
  isSelecting: boolean;
  selectedRowIds: Record<string, boolean>;
  count: number;
  setIsSelecting: (isSelecting: boolean) => void;
  toggleRow: (id: string) => void;
  clear: () => void;
}

export const useSelectionStore = create<SelectionStore>((set) => ({
  isSelecting: false,
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

  setIsSelecting: (isSelecting) => set({ isSelecting }),

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
      }),
    normalizationContext: null,
    setNormalizationContext: (context) =>
      set({ normalizationContext: context }),
  }),
);
