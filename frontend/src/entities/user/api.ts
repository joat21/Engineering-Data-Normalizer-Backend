import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../shared/api/base";
import type { User } from "./types";

export const authMe = () => api.get<User>("/auth/me").then((r) => r.data);

export const useAuthMe = () =>
  useQuery<User>({
    queryKey: ["auth", "me"],
    queryFn: authMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

export const useAuthUser = () => {
  const qc = useQueryClient();
  const user = qc.getQueryData<User>(["auth", "me"]);

  if (!user) {
    throw new Error("useAuthUser used outside of AuthProvider");
  }

  return user;
};
