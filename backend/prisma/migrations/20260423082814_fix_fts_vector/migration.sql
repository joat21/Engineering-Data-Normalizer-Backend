ALTER TABLE "Equipment" DROP COLUMN IF EXISTS "search_vector";

ALTER TABLE "Equipment" 
ADD COLUMN "search_vector" tsvector 
GENERATED ALWAYS AS (
  to_tsvector('russian', coalesce("searchText", ''))
) STORED;

DROP INDEX IF EXISTS "equipment_search_idx";
CREATE INDEX "equipment_search_idx" ON "Equipment" USING GIN ("search_vector");