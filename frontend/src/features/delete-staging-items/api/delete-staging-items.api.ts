import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { DeleteStagingItemsBody } from "@engineering-data-normalizer/shared";
import { api } from "@/shared/api/base";

export const deleteStagingItems = async (data: DeleteStagingItemsBody) =>
  api.delete("/import/staging", { data }).then((r) => r.data);

export const useDeleteStagingItemsMutation = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: deleteStagingItems,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["import", "staging-table"] }),
  });
};
