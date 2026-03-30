import { create } from "zustand";
import type { SourceType } from "@engineering-data-normalizer/shared";
import { SingleImportStep, type CatalogImportStep } from "./types";

interface ImportState {
  step: SingleImportStep | CatalogImportStep;
  sourceType: SourceType | null;
  categoryId: string | null;
  categoryName?: string;
  file: File | null;
  sessionId: string | null;

  setInitialData: (data: {
    categoryId: string;
    file: File;
    sourceType: SourceType;
  }) => void;
  setCategoryId: (categoryId: string) => void;
  setCategoryName: (name?: string) => void;
  setSessionId: (id: string) => void;
  setStep: (step: SingleImportStep | CatalogImportStep) => void;
  reset: () => void;
}

export const useImportStore = create<ImportState>((set) => ({
  step: SingleImportStep.TYPE_SELECTION,
  sourceType: null,
  categoryId: null,
  file: null,
  sessionId: null,

  setInitialData: (data) =>
    set({ ...data, step: SingleImportStep.FILL_ATTRIBUTES }),
  setCategoryId: (id) => set({ categoryId: id }),
  setCategoryName: (name) => set({ categoryName: name }),
  setSessionId: (id) => set({ sessionId: id }),
  setStep: (step) => set({ step }),
  reset: () =>
    set({
      step: SingleImportStep.TYPE_SELECTION,
      categoryId: null,
      file: null,
      sessionId: null,
    }),
}));
