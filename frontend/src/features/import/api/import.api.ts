import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AiParseBody,
  AiParseColumnResult,
  ApplyTransformBody,
  ApplyTransformParams,
  CreateEquipmentFromStagingQuery,
  EditAiParseResultsBody,
  EditAiParseResultsParams,
  GetStagingTableParams,
  ImportRowsBody,
  ImportRowsParams,
  InitImportBody,
  MapColToAttrBody,
  MapColToAttrParams,
  MapTransformResult,
  ResolveNormalizationIssuesBody,
  ResolveNormalizationIssuesParams,
  SaveAiParseResultsBody,
  SaveAiParseResultsParams,
  StagingTable,
} from "@engineering-data-normalizer/shared";
import { api } from "@/shared/api/base";

interface InitImportArgs extends InitImportBody {
  file: File;
}

export const initImport = async ({ file, ...data }: InitImportArgs) => {
  const formData = new FormData();

  formData.append("file", file);

  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  });

  const response = await api.post<{ sessionId: string; pdfUrl: string }>(
    "/import/init",
    formData,
  );
  return response.data;
};

export const useInitImportMutation = () =>
  useMutation({
    mutationKey: ["import", "init"],
    mutationFn: (data: InitImportArgs) => initImport(data),
  });

export const importRows = (data: ImportRowsParams & ImportRowsBody) =>
  api
    .post(`/import/${data.sessionId}`, { rows: data.rows })
    .then((r) => r.data);

export const useImportRowsMutation = () =>
  useMutation({
    mutationKey: ["import", "rows"],
    mutationFn: (data: ImportRowsParams & ImportRowsBody) => importRows(data),
  });

export const getStagingTable = (data: GetStagingTableParams) =>
  api.get<StagingTable>(`/import/${data.sessionId}`).then((r) => r.data);

export const useStagingTable = (data: GetStagingTableParams) =>
  useQuery({
    queryKey: ["import", "staging-table", data.sessionId],
    queryFn: () => getStagingTable(data),
  });

export const mapping = (data: MapColToAttrParams & MapColToAttrBody) =>
  api
    .post<MapTransformResult>(`/import-sessions/${data.sessionId}/mapping`, {
      colIndex: data.colIndex,
      target: data.target,
    })
    .then((r) => r.data);

export const useMappingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["import", "mapping"],
    mutationFn: mapping,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["import", "staging-table", variables.sessionId],
      });
    },
  });
};

export const applyTransform = (
  data: ApplyTransformParams & ApplyTransformBody,
) =>
  api
    .post<MapTransformResult>(`/import-sessions/${data.sessionId}/transform`, {
      colIndex: data.colIndex,
      transform: data.transform,
      targets: data.targets,
    })
    .then((r) => r.data);

export const useApplyTransformMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["import", "transfrom"],
    mutationFn: applyTransform,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["import", "staging-table", variables.sessionId],
      });
    },
  });
};

export const applyAiParse = (data: AiParseBody) =>
  api.post<AiParseColumnResult>("/ai-parse", data).then((r) => r.data);

export const useApplyAiParseMutation = () =>
  useMutation({
    mutationKey: ["ai-parse"],
    mutationFn: applyAiParse,
    meta: {
      successMessage: "Обработка завершена успешно",
    },
  });

export const saveAiParseResults = (
  data: SaveAiParseResultsParams & SaveAiParseResultsBody,
) =>
  api
    .post<MapTransformResult>(`/ai-parse/${data.sessionId}/commit`, data)
    .then((r) => r.data);

export const useSaveAiParseResultsMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["ai-parse", "save"],
    mutationFn: saveAiParseResults,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["import", "staging-table", variables.importSessionId],
      });
    },
  });
};

export const resolveNormalizationIssues = (
  data: ResolveNormalizationIssuesParams & ResolveNormalizationIssuesBody,
) =>
  api
    .patch<MapTransformResult>(`/import-sessions/${data.sessionId}`, data)
    .then((r) => r.data);

export const useResolveNormalizationIssuesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["normalization-issues", "resolve"],
    mutationFn: resolveNormalizationIssues,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["import", "staging-table", variables.sessionId],
      });
    },
    meta: {
      successMessage: "Данные сохранены",
    },
  });
};

export const editAiParseResults = (
  data: EditAiParseResultsParams & EditAiParseResultsBody,
) => api.patch(`/ai-parse/${data.sessionId}`, data).then((r) => r.data);

export const useEditAiParseResultsMutation = () =>
  useMutation({
    mutationFn: editAiParseResults,
    meta: {
      successMessage: "Изменения сохранены",
    },
  });

export const createEquipmentFromStaging = (
  data: CreateEquipmentFromStagingQuery,
) =>
  api
    .post(`/equipment/staging?sessionId=${data.sessionId}`)
    .then((r) => r.data);

export const useCreateEquipmentFromStagingMutation = () =>
  useMutation({
    mutationKey: ["staging", "equipment"],
    mutationFn: createEquipmentFromStaging,
  });
