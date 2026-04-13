-- AddForeignKey
ALTER TABLE "NormalizationCache" ADD CONSTRAINT "NormalizationCache_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "CategoryAttribute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
