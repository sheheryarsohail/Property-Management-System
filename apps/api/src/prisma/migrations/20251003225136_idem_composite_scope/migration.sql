/*
  Warnings:

  - You are about to drop the column `resourceUrl` on the `IdempotencyKey` table. All the data in the column will be lost.
  - Added the required column `tenantId` to the `IdempotencyKey` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "IdempotencyKey" DROP COLUMN "resourceUrl",
ADD COLUMN     "response" JSONB,
ADD COLUMN     "tenantId" TEXT NOT NULL;
