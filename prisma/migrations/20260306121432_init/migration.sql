-- CreateEnum
CREATE TYPE "DataType" AS ENUM ('STRING', 'NUMBER', 'BOOLEAN');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('CATALOG', 'SINGLE_ITEM');

-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ImportItemStatus" AS ENUM ('PENDING', 'TRANSFORMED', 'EDITED_MANUALLY');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectItem" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "equipmentId" UUID NOT NULL,
    "amount" SMALLINT NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipment" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "name" TEXT,
    "manufacter" TEXT,
    "article" TEXT,
    "model" TEXT,
    "externalCode" TEXT,
    "price" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentAttributeValue" (
    "id" UUID NOT NULL,
    "equipmentId" UUID NOT NULL,
    "attributeId" UUID NOT NULL,
    "valueString" TEXT NOT NULL,
    "valueMin" DECIMAL(12,2),
    "valueMax" DECIMAL(12,2),
    "valueArray" JSONB,
    "valueBoolean" BOOLEAN,

    CONSTRAINT "EquipmentAttributeValue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryAttribute" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "dataType" "DataType" NOT NULL,
    "isFilterable" BOOLEAN NOT NULL,

    CONSTRAINT "CategoryAttribute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Source" (
    "id" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "uploadedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "SourceType" NOT NULL,
    "fileHash" TEXT NOT NULL,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comparison" (
    "id" UUID NOT NULL,
    "userId" UUID,

    CONSTRAINT "Comparison_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComparisonItem" (
    "id" UUID NOT NULL,
    "comparisonId" UUID NOT NULL,

    CONSTRAINT "ComparisonItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportSession" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "ImportSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StagingImportItem" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "rawRow" JSONB NOT NULL,
    "transformedRow" JSONB,
    "status" "ImportItemStatus" NOT NULL DEFAULT 'PENDING',

    CONSTRAINT "StagingImportItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryFilter" (
    "id" UUID NOT NULL,
    "categoryId" UUID NOT NULL,
    "attributeId" UUID NOT NULL,

    CONSTRAINT "CategoryFilter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Source_fileHash_key" ON "Source"("fileHash");

-- CreateIndex
CREATE UNIQUE INDEX "Comparison_userId_key" ON "Comparison"("userId");

-- AddForeignKey
ALTER TABLE "ProjectItem" ADD CONSTRAINT "ProjectItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectItem" ADD CONSTRAINT "ProjectItem_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentAttributeValue" ADD CONSTRAINT "EquipmentAttributeValue_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentAttributeValue" ADD CONSTRAINT "EquipmentAttributeValue_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "CategoryAttribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryAttribute" ADD CONSTRAINT "CategoryAttribute_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comparison" ADD CONSTRAINT "Comparison_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComparisonItem" ADD CONSTRAINT "ComparisonItem_comparisonId_fkey" FOREIGN KEY ("comparisonId") REFERENCES "Comparison"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportSession" ADD CONSTRAINT "ImportSession_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportSession" ADD CONSTRAINT "ImportSession_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StagingImportItem" ADD CONSTRAINT "StagingImportItem_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ImportSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryFilter" ADD CONSTRAINT "CategoryFilter_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryFilter" ADD CONSTRAINT "CategoryFilter_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "CategoryAttribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
