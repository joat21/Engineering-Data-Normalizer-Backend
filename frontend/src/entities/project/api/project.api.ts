import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ExportProjectToExcelParams,
  GetProjectDetailsParams,
  Project,
  ProjectDetails,
  UpsertProjectItemBody,
  UpsertProjectItemParams,
} from "@engineering-data-normalizer/shared";
import { api } from "@/shared/api/base";

export const getProjects = () =>
  api.get<Project[]>("/projects").then((r) => r.data);

export const useProjects = () =>
  useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

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

export const getProjectDetails = (data: GetProjectDetailsParams) =>
  api.get<ProjectDetails>(`/projects/${data.id}`).then((r) => r.data);

export const useProjectDetails = (data: GetProjectDetailsParams) =>
  useQuery({
    queryKey: ["projects", data.id],
    queryFn: () => getProjectDetails(data),
  });

export const exportToExcel = (data: ExportProjectToExcelParams) =>
  api.get(`/projects/${data.id}/xlsx`, {
    responseType: "blob",
  });
