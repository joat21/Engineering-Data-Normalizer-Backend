import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  UpsertProjectItemBody,
  UpsertProjectItemParams,
} from "@engineering-data-normalizer/shared";
import { api } from "@/shared/api/base";

export const addToProject = (
  data: UpsertProjectItemParams & UpsertProjectItemBody,
) =>
  api.post<void>(`/projects/${data.projectId}/items`, data).then((r) => r.data);

export const useAddToProjectMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationKey: ["projects", "add-item"],
    mutationFn: addToProject,
    meta: {
      successMessage: "Оборудование добавлено в проект",
    },
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["projects", variables.projectId] }),
  });
};
