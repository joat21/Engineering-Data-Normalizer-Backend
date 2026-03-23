import { useMutation } from "@tanstack/react-query";
import type { InitImportBody } from "@engineering-data-normalizer/shared";
import { api } from "@/shared/api/base";

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
