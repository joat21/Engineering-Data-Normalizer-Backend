import { useQuery } from "@tanstack/react-query";
import type { Category } from "@engineering-data-normalizer/shared";
import { api } from "@/shared/api/base";

export const getCategories = () =>
  api.get<Category[]>("/categories").then((r) => r.data);

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
