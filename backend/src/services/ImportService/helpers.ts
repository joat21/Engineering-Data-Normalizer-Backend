import {
  MappingTarget,
  MappingTargetType,
  SYSTEM_FIELDS_CONFIG,
} from "@engineering-data-normalizer/shared";
import libre from "libreoffice-convert";
import path from "path";
import { AttributeInfo } from "../NormalizationService/types";
import { CONVERTIBLE_EXTENSIONS } from "../../config";

export const processFileForPreview = async (
  file: Express.Multer.File,
): Promise<Buffer | null> => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!CONVERTIBLE_EXTENSIONS.includes(ext)) return null;

  return await new Promise((resolve, reject) => {
    libre.convert(file.buffer, ".pdf", undefined, (err, done) => {
      if (err) return reject(err);
      resolve(done);
    });
  });
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
