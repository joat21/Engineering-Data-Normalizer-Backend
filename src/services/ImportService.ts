import { prisma } from "../../prisma/prisma";
import { SourceType } from "../generated/prisma/enums";
import { calculateHashAsync } from "../helpers/calculateHashAsync";
import { uploadFile } from "./S3Service";
import { createSource } from "./SourceService";

export const createSession = async (data: {
  categoryId: string;
  file: Express.Multer.File;
}) => {
  const fileHash = await calculateHashAsync(data.file.buffer);
  let source = await prisma.source.findUnique({
    where: { fileHash },
  });

  if (!source) {
    const url = await uploadFile(data.file);
    source = await createSource({
      fileName: data.file.originalname,
      url,
      fileHash,
      type: SourceType.CATALOG,
    });
  }

  const session = await prisma.importSession.create({
    data: {
      categoryId: data.categoryId,
      sourceId: source.id,
    },
  });

  return session.id;
};

export const addItemsToStaging = async (data: {
  sessionId: string;
  rows: (string | number)[][];
}) => {
  const session = await prisma.importSession.findUnique({
    where: { id: data.sessionId },
  });

  if (!session) throw new Error("Session not found");

  await prisma.stagingImportItem.createMany({
    data: data.rows.map((row) => ({
      sessionId: data.sessionId,
      rawRow: row,
    })),
  });
};
