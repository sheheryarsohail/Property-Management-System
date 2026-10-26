/*
  Warnings:

  - The primary key for the `IdempotencyKey` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `response` on the `IdempotencyKey` table. All the data in the column will be lost.
  - You are about to drop the column `tenantId` on the `IdempotencyKey` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tenantId,sha256]` on the table `FileObject` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[key,scope]` on the table `IdempotencyKey` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `IdempotencyKey` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `scope` to the `IdempotencyKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "IdempotencyKey" DROP CONSTRAINT "IdempotencyKey_pkey",
DROP COLUMN "response",
DROP COLUMN "tenantId",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "resourceUrl" TEXT,
ADD COLUMN     "scope" TEXT NOT NULL,
ADD CONSTRAINT "IdempotencyKey_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "FileObject_tenantId_sha256_key" ON "FileObject"("tenantId", "sha256");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_key_scope_key" ON "IdempotencyKey"("key", "scope");
