import {
  MappingTarget,
  MappingTargetType,
  SYSTEM_FIELDS_CONFIG,
} from "@engineering-data-normalizer/shared";
import libre from "libreoffice-convert";
import path from "path";
import { promisify } from "util";
import { AttributeInfo } from "../NormalizationService/types";
import { CONVERTIBLE_EXTENSIONS } from "../../config";

const convertAsync = promisify(libre.convert);

export const processFileForPreview = async (
  file: Express.Multer.File,
): Promise<Buffer | null> => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (CONVERTIBLE_EXTENSIONS.includes(ext)) {
    return await convertAsync(file.buffer, ".pdf", undefined);
  }

  return null;
};

export const getTargetLabel = (
  target: MappingTarget,
  attributeInfoMap: Map<string, AttributeInfo>,
): string => {
  if (target.type === MappingTargetType.SYSTEM) {
    return SYSTEM_FIELDS_CONFIG[target.field]?.label || target.field;
  }
  return attributeInfoMap.get(target.id)?.label || `Атрибут ${target.id}`;
};
