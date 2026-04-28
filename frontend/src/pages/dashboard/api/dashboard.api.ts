import { useQuery } from "@tanstack/react-query";
import type { DashboardSummary } from "@engineering-data-normalizer/shared";
import { api } from "@/shared/api/base";

export const getStatistics = async () =>
  api.get<DashboardSummary>("/dashboard/summary").then((r) => r.data);

export const useStatistics = () =>
  useQuery({
    queryKey: ["statistics"],
    queryFn: getStatistics,
  });
