import { useMutation, useQuery } from "@tanstack/react-query";
import type {
  AiParseFileResult,
  CreateEquipmentBody,
  ParseFileParams,
} from "@engineering-data-normalizer/shared";
import { api } from "@/shared/api/base";

export const createEquipment = (data: CreateEquipmentBody) =>
  api.post("/equipment", data).then((r) => r.data);

export const useCreateEquipmentMutation = () =>
  useMutation({
    mutationKey: ["equipment"],
    mutationFn: (data: CreateEquipmentBody) => createEquipment(data),
  });

export const aiParseFile = (data: ParseFileParams) =>
  api
    .get<AiParseFileResult>(`/ai-parse/${data.importSessionId}/parse-file`)
    .then((r) => r.data);

export const useAiParseFile = (data: ParseFileParams) =>
  useQuery({
    queryKey: ["ai-parse", "file"],
    queryFn: () => aiParseFile(data),
  });
