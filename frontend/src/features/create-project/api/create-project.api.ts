import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateProjectBody } from "@engineering-data-normalizer/shared";
import { api } from "@/shared/api/base";

export const createProject = (data: CreateProjectBody) =>
  api.post("/projects", data);

export const useCreateProjectMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createProject,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};
