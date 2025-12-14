-- CreateIndex
CREATE UNIQUE INDEX "valuations_tenantId_assetId_date_key" ON "valuations"("tenantId", "assetId", "date");
