import { SourceType } from "@engineering-data-normalizer/shared";
import { prisma } from "../prisma";

export const createSource = async (data: {
  fileName: string;
  url: string;
  type: SourceType;
  fileHash: string;
  manufacturerId?: string;
  supplierId?: string;
}) =>
  await prisma.source.create({
    data,
  });
