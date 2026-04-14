import { useQuery } from "@tanstack/react-query";
import type {
  ExportProjectToExcelParams,
  GetProjectDetailsParams,
  Project,
  ProjectDetails,
} from "@engineering-data-normalizer/shared";
import { api } from "@/shared/api/base";

export const getProjects = () =>
  api.get<Project[]>("/projects").then((r) => r.data);

export const useProjects = () =>
  useQuery({
    queryKey: ["projects"],
    queryFn: getProjects,
  });

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
