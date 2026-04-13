import { api } from "@/shared/api/base";
import type {
  UpdateProjectBody,
  UpdateProjectParams,
} from "@engineering-data-normalizer/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const editProject = (data: UpdateProjectParams & UpdateProjectBody) =>
  api.patch(`/projects/${data.id}`, data).then((r) => r.data);

export const useEditProjectMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: editProject,
    onSuccess: (_data, variables) =>
      qc.invalidateQueries({ queryKey: ["projects", variables.id] }),
  });
};
