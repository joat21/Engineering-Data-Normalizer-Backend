import type { LoginInput } from "@engineering-data-normalizer/shared";
import { api } from "../../../shared/api/base";
import { useMutation } from "@tanstack/react-query";

export const login = async (data: LoginInput) =>
  api.post("/auth/login", data).then((res) => res.data);

export const useLoginMutation = () =>
  useMutation({
    mutationKey: ["auth"],
    mutationFn: (data: LoginInput) => login(data),
  });
