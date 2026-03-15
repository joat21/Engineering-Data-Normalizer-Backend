-- CreateEnum
CREATE TYPE "MappingTargetType" AS ENUM ('SYSTEM', 'ATTRIBUTE');

-- CreateTable
CREATE TABLE "AiExtractionResult" (
    "id" UUID NOT NULL,
    "sourceItemId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "targetType" "MappingTargetType" NOT NULL,
    "target" TEXT NOT NULL,
    "rawValue" TEXT NOT NULL,
    "isEdited" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AiExtractionResult_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AiExtractionResult" ADD CONSTRAINT "AiExtractionResult_sourceItemId_fkey" FOREIGN KEY ("sourceItemId") REFERENCES "StagingImportItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
