/*
  Warnings:

  - A unique constraint covering the columns `[key,scope]` on the table `IdempotencyKey` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_key_scope_key" ON "IdempotencyKey"("key", "scope");
