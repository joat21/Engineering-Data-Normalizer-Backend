import { api } from "@/shared/api/base";
import type {
  ResetColumnBody,
  ResetColumnParams,
} from "@engineering-data-normalizer/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const resetColumn = async (data: ResetColumnParams & ResetColumnBody) =>
  api
    .patch(`/import-sessions/${data.sessionId}/reset`, data)
    .then((r) => r.data);

export const useResetColumnMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: resetColumn,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["import", "staging-table"] }),
  });
};
