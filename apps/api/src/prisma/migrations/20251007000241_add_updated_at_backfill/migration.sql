/*
  Warnings:

  - You are about to alter the column `amount` on the `Expense` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `tax` on the `Expense` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `net` on the `Expense` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `shareBasis` on the `ExpenseAllocation` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `amount` on the `ExpenseAllocation` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `amount` on the `Invoice` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `amount` on the `Pdc` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to alter the column `amount` on the `ReceiptAllocation` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(12,2)`.
  - You are about to drop the column `createdBy` on the `Statement` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `Statement` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[key]` on the table `IdempotencyKey` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `updatedAt` to the `FileObject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Pdc` table without a default value. This is not possible if the table is not empty.
  - Made the column `updatedAt` on table `Receipt` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "IdempotencyKey_key_scope_key";

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "tax" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "net" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "ExpenseAllocation" ALTER COLUMN "shareBasis" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "FileObject" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "FileObject" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
ALTER TABLE "FileObject" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "FileObject" ALTER COLUMN "updatedAt" SET NOT NULL;
-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "updatedAt" TIMESTAMP(3);
UPDATE "Invoice" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
ALTER TABLE "Invoice" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Invoice" ALTER COLUMN "updatedAt" SET NOT NULL;
-- AlterTable
ALTER TABLE "Pdc" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
UPDATE "Receipt" SET "updatedAt" = NOW() WHERE "updatedAt" IS NULL;
ALTER TABLE "Receipt" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Receipt" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "ReceiptAllocation" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(12,2);

-- AlterTable
ALTER TABLE "Statement" DROP COLUMN "createdBy",
DROP COLUMN "updatedBy";

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_key_key" ON "IdempotencyKey"("key");

-- CreateIndex
CREATE INDEX "IdempotencyKey_tenantId_idx" ON "IdempotencyKey"("tenantId");

-- CreateIndex
CREATE INDEX "IdempotencyKey_scope_idx" ON "IdempotencyKey"("scope");
