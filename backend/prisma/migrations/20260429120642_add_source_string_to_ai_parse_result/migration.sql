/*
  Warnings:

  - Added the required column `sourceString` to the `AiParseResult` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AiParseResult" ADD COLUMN     "sourceString" TEXT NOT NULL;
