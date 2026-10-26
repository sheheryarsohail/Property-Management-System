/*
  Warnings:

  - Added the required column `updatedAt` to the `OwnershipTransfer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "OwnershipTransfer" ADD COLUMN     "adminOverride" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "adminOverrideBy" TEXT,
ADD COLUMN     "adminOverrideReason" TEXT,
ADD COLUMN     "affidavitAttachment" TEXT,
ADD COLUMN     "applicationAttachment" TEXT,
ADD COLUMN     "duesCleared" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "newOwnerSnapshot" JSONB,
ADD COLUMN     "nocAttachment" TEXT,
ADD COLUMN     "previousOwnerSnapshot" JSONB,
ADD COLUMN     "propertySnapshot" JSONB,
ADD COLUMN     "status" "TransferStatus" NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "OwnershipTransfer_tenantId_status_idx" ON "OwnershipTransfer"("tenantId", "status");
