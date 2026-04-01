import { api } from "@/shared/api/base";
import type {
  UpdateCategoryAttributeBody,
  UpdateCategoryAttributeParams,
} from "@engineering-data-normalizer/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const editCategoryAttribute = (
  data: UpdateCategoryAttributeParams & UpdateCategoryAttributeBody,
) => api.patch(`/categories/attributes/${data.id}`, data).then((r) => r.data);

export const useEditCategoryAttributeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: editCategoryAttribute,
    onSuccess: (data) =>
      queryClient.invalidateQueries({
        queryKey: ["category-with-attributes", data.categoryId],
      }),
  });
};
