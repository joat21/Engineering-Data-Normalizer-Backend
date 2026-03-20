/*
  Warnings:

  - A unique constraint covering the columns `[projectId,equipmentId]` on the table `ProjectItem` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ProjectItem_projectId_equipmentId_key" ON "ProjectItem"("projectId", "equipmentId");
