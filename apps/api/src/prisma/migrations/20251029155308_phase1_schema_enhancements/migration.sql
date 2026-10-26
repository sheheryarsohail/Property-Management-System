/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,code]` on the table `Receipt` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Receipt` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('BOOKING', 'INSTALLMENT', 'HALF_YEARLY', 'YEARLY', 'DEVELOPMENT_CHARGE', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ReceiptStatus" AS ENUM ('DRAFT', 'POSTED', 'REVERSED');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'IN_TRANSFER', 'SOLD', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('RESIDENTIAL', 'COMMERCIAL');

-- AlterEnum
ALTER TYPE "InvoiceStatus" ADD VALUE 'OVERDUE';

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "address" TEXT,
ADD COLUMN     "fatherName" TEXT,
ADD COLUMN     "husbandName" TEXT,
ADD COLUMN     "mobile" TEXT,
ADD COLUMN     "nomineeAddress" TEXT,
ADD COLUMN     "nomineeNIC" TEXT,
ADD COLUMN     "nomineeName" TEXT,
ADD COLUMN     "nomineeRelation" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "type" "InvoiceType" NOT NULL DEFAULT 'INSTALLMENT';

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "block" TEXT,
ADD COLUMN     "bookingPrice" DECIMAL(14,2),
ADD COLUMN     "halfYearlyPrice" DECIMAL(14,2),
ADD COLUMN     "installmentPrice" DECIMAL(14,2),
ADD COLUMN     "isCorner" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isParkingFacing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRoadFacing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isWestOpen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "status" "PropertyStatus" NOT NULL DEFAULT 'AVAILABLE',
ADD COLUMN     "totalPrice" DECIMAL(14,2),
ADD COLUMN     "type" "PropertyType",
ADD COLUMN     "yearlyPrice" DECIMAL(14,2);

-- AlterTable
-- First add columns as nullable
ALTER TABLE "Receipt" ADD COLUMN     "attachments" JSONB,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "chequeDate" TIMESTAMP(3),
ADD COLUMN     "chequeNumber" TEXT,
ADD COLUMN     "code" TEXT,
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "slipNumber" TEXT,
ADD COLUMN     "status" "ReceiptStatus" NOT NULL DEFAULT 'POSTED',
ADD COLUMN     "updatedAt" TIMESTAMP(3);

-- Populate code for existing receipts using a sequence
WITH numbered AS (
  SELECT id, 'RCPT-' || LPAD(ROW_NUMBER() OVER (PARTITION BY "tenantId" ORDER BY "createdAt")::TEXT, 6, '0') as new_code
  FROM "Receipt"
  WHERE "code" IS NULL
)
UPDATE "Receipt" SET "code" = numbered.new_code
FROM numbered
WHERE "Receipt".id = numbered.id;

-- Populate updatedAt with createdAt for existing records
UPDATE "Receipt" SET "updatedAt" = "createdAt" WHERE "updatedAt" IS NULL;

-- Now make them NOT NULL
ALTER TABLE "Receipt" ALTER COLUMN "code" SET NOT NULL;
ALTER TABLE "Receipt" ALTER COLUMN "updatedAt" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Invoice_tenantId_type_idx" ON "Invoice"("tenantId", "type");

-- CreateIndex
CREATE INDEX "Property_tenantId_status_idx" ON "Property"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Property_tenantId_type_idx" ON "Property"("tenantId", "type");

-- CreateIndex
CREATE INDEX "Receipt_tenantId_propertyId_idx" ON "Receipt"("tenantId", "propertyId");

-- CreateIndex
CREATE INDEX "Receipt_tenantId_status_idx" ON "Receipt"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Receipt_tenantId_code_key" ON "Receipt"("tenantId", "code");

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;
