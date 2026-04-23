-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "search_vector" tsvector;

ALTER TABLE "Equipment" 
ADD COLUMN IF NOT EXISTS "search_vector" tsvector 
GENERATED ALWAYS AS (
  to_tsvector('russian', coalesce("searchText", ''))
) STORED;

-- CreateIndex
CREATE INDEX "equipment_search_idx" ON "Equipment" USING GIN ("search_vector");
