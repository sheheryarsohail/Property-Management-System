/*
  Warnings:

  - Added the required column `category` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `RecoveryCharge` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('OFFICE', 'DEVELOPMENT');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('PURCHASE_INVOICE', 'PETTY_CASH', 'ADVANCE_TO_VENDOR');

-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'APPROVED', 'POSTED', 'CANCELLED');

-- AlterTable
-- Add columns as nullable first
ALTER TABLE "Expense" ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "billDate" TIMESTAMP(3),
ADD COLUMN     "billNumber" TEXT,
ADD COLUMN     "category" "ExpenseCategory",
ADD COLUMN     "costCenter" TEXT,
ADD COLUMN     "netAmount" DECIMAL(14,2),
ADD COLUMN     "project" TEXT,
ADD COLUMN     "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "subcategory" TEXT,
ADD COLUMN     "tax" DECIMAL(14,2),
ADD COLUMN     "type" "ExpenseType",
ADD COLUMN     "updatedAt" TIMESTAMP(3),
ADD COLUMN     "vendorId" TEXT,
ADD COLUMN     "vendorName" TEXT;

-- Set defaults for existing records
UPDATE "Expense" SET "category" = 'DEVELOPMENT' WHERE "category" IS NULL;
UPDATE "Expense" SET "type" = 'PURCHASE_INVOICE' WHERE "type" IS NULL;
UPDATE "Expense" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

-- Make columns NOT NULL
ALTER TABLE "Expense" ALTER COLUMN "category" SET NOT NULL;
ALTER TABLE "Expense" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "Expense" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "ExpensePool" ADD COLUMN     "description" TEXT;

-- AlterTable
ALTER TABLE "RecoveryCharge" ADD COLUMN     "allocationMethod" TEXT,
ADD COLUMN     "allocationShare" DECIMAL(14,6),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "invoiceId" TEXT,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "poolId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- Set default for existing records
UPDATE "RecoveryCharge" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

-- Make NOT NULL
ALTER TABLE "RecoveryCharge" ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Expense_tenantId_category_idx" ON "Expense"("tenantId", "category");

-- CreateIndex
CREATE INDEX "Expense_tenantId_status_idx" ON "Expense"("tenantId", "status");

-- CreateIndex
CREATE INDEX "RecoveryCharge_tenantId_poolId_idx" ON "RecoveryCharge"("tenantId", "poolId");

-- AddForeignKey
ALTER TABLE "RecoveryCharge" ADD CONSTRAINT "RecoveryCharge_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "ExpensePool"("id") ON DELETE SET NULL ON UPDATE CASCADE;
