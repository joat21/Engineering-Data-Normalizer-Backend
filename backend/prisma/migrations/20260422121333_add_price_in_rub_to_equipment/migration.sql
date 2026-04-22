/*
  Warnings:

  - Added the required column `priceInRub` to the `Equipment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "priceInRub" DECIMAL(12,2) NOT NULL;
