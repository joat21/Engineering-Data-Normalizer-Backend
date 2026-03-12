/*
  Warnings:

  - A unique constraint covering the columns `[categoryId,attributeId]` on the table `CategoryFilter` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[categoryId,systemField]` on the table `CategoryFilter` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `label` to the `CategoryFilter` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `CategoryFilter` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "CategoryFilter" DROP CONSTRAINT "CategoryFilter_attributeId_fkey";

-- AlterTable
ALTER TABLE "CategoryFilter" ADD COLUMN     "label" TEXT NOT NULL,
ADD COLUMN     "maxValue" DECIMAL(12,2),
ADD COLUMN     "minValue" DECIMAL(12,2),
ADD COLUMN     "options" JSONB,
ADD COLUMN     "systemField" TEXT,
ADD COLUMN     "type" "DataType" NOT NULL,
ALTER COLUMN "attributeId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "CategoryFilter_categoryId_attributeId_key" ON "CategoryFilter"("categoryId", "attributeId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryFilter_categoryId_systemField_key" ON "CategoryFilter"("categoryId", "systemField");

-- AddForeignKey
ALTER TABLE "CategoryFilter" ADD CONSTRAINT "CategoryFilter_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "CategoryAttribute"("id") ON DELETE SET NULL ON UPDATE CASCADE;
