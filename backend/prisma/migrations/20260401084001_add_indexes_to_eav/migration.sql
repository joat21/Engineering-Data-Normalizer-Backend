-- CreateIndex
CREATE INDEX "EquipmentAttributeValue_attributeId_valueString_idx" ON "EquipmentAttributeValue"("attributeId", "valueString");

-- CreateIndex
CREATE INDEX "EquipmentAttributeValue_attributeId_valueMin_valueMax_idx" ON "EquipmentAttributeValue"("attributeId", "valueMin", "valueMax");

-- CreateIndex
CREATE INDEX "EquipmentAttributeValue_attributeId_valueBoolean_idx" ON "EquipmentAttributeValue"("attributeId", "valueBoolean");
