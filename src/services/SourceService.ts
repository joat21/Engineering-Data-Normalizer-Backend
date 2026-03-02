import { SourceType } from "../generated/prisma/enums";
import { prisma } from "../../prisma/prisma";

export const createSource = async (data: {
  fileName: string;
  url: string;
  type: SourceType;
  fileHash: string;
}) =>
  await prisma.source.create({
    data,
  });
