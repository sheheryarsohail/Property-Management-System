-- CreateIndex
CREATE INDEX "fileobject_tenant_sha_idx" ON "FileObject"("tenantId", "sha256");
