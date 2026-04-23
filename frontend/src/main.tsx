import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router";
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { I18nProvider, toast, Toast } from "@heroui/react";

import "./index.css";
import App from "./App.tsx";
import axios from "axios";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
  mutationCache: new MutationCache({
    onSuccess: (_data, _variables, _onMutateResult, mutation) => {
      const meta = mutation.meta;

      if (!meta?.successMessage) return;

      const message =
        typeof meta.successMessage === "string"
          ? meta.successMessage
          : "Операция завершена успешно";

      toast.success(message);
    },

    onError: (error, _variables, _onMutateResult, mutation) => {
      const meta = mutation.meta;

      // если явно передано false - не показываем тост
      if (meta?.errorMessage === false) return;

      let errorMessage;

      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data["message"];
      } else {
        errorMessage = error.message;
      }

      const metaErrorMessage =
        typeof meta?.errorMessage === "string"
          ? meta.errorMessage
          : "Произошла ошибка. Повторите попытку позже";

      const message = errorMessage || metaErrorMessage;

      toast.danger(message);
    },
  }),
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <I18nProvider locale="ru-RU">
          <Toast.Provider placement="bottom end" />
          <App />
        </I18nProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
);
