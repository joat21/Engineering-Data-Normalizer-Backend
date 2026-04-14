import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AddToComparisonBody,
  ComparisonCategory,
  RemoveFromComparisonParams,
} from "@engineering-data-normalizer/shared";
import { api } from "@/shared/api/base";

export const getComparisonList = () =>
  api.get<ComparisonCategory[]>("/comparison").then((r) => r.data);

export const useComparison = () =>
  useQuery({ queryKey: ["comparison", "list"], queryFn: getComparisonList });

export const addToComparison = (data: AddToComparisonBody) =>
  api.post("/comparison", data).then((r) => r.data);

export const useAddToComparisonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addToComparison,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["comparison"] }),
    meta: {
      successMessage: "Оборудование добавлено в сравнение",
    },
  });
};

export const removeFromComparison = (data: RemoveFromComparisonParams) =>
  api.delete(`/comparison/${data.itemId}`).then((r) => r.data);

export const useRemoveFromComparisonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeFromComparison,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["comparison"] }),
  });
};
