/*
  Warnings:

  - A unique constraint covering the columns `[fileHash]` on the table `Source` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fileHash` to the `Source` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Source" ADD COLUMN     "fileHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Source_fileHash_key" ON "Source"("fileHash");
