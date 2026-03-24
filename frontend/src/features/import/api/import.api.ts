import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  GetStagingTableParams,
  ImportRowsBody,
  ImportRowsParams,
  InitImportBody,
  MapColToAttrBody,
  MapColToAttrParams,
} from "@engineering-data-normalizer/shared";
import { api } from "@/shared/api/base";
import type { StagingTable } from "../model/types";

interface InitImportArgs extends InitImportBody {
  file: File;
}

export const initImport = async ({ file, ...data }: InitImportArgs) => {
  const formData = new FormData();

  formData.append("file", file);

  formData.append("categoryId", data.categoryId);
  formData.append("sourceType", data.sourceType);
  if (data.originHeader) {
    formData.append("originHeader", JSON.stringify(data.originHeader));
  }

  const response = await api.post<{ sessionId: string }>(
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
    .post(`/import-sessions/${data.sessionId}/mapping`, {
      colIndex: data.colIndex,
      target: data.target,
    })
    .then((r) => r.data);

export const useMappingMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mapping,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["import", "staging-table", variables.sessionId],
      });
    },
  });
};
