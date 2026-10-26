/*
  Warnings:

  - You are about to drop the column `address` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `guardianName` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `nic` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `nomineeJson` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `phones` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `billNo` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `costCenter` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `net` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `project` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `subcategory` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `tax` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `vendor` on the `Expense` table. All the data in the column will be lost.
  - You are about to drop the column `fromDate` on the `ExpensePool` table. All the data in the column will be lost.
  - You are about to drop the column `method` on the `ExpensePool` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `ExpensePool` table. All the data in the column will be lost.
  - You are about to drop the column `scopeBlock` on the `ExpensePool` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `ExpensePool` table. All the data in the column will be lost.
  - You are about to drop the column `toDate` on the `ExpensePool` table. All the data in the column will be lost.
  - You are about to drop the column `response` on the `IdempotencyKey` table. All the data in the column will be lost.
  - You are about to drop the column `scope` on the `IdempotencyKey` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `IdempotencyKey` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `seq` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Invoice` table. All the data in the column will be lost.
  - The `status` column on the `Invoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `fromDate` on the `Ownership` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Ownership` table. All the data in the column will be lost.
  - You are about to drop the column `toDate` on the `Ownership` table. All the data in the column will be lost.
  - You are about to drop the column `block` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `flagsJson` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `plotNo` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `sizeYd2` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Property` table. All the data in the column will be lost.
  - You are about to drop the column `createdBy` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `date` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `instrument` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `mode` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `propertyId` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `seq` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Receipt` table. All the data in the column will be lost.
  - You are about to drop the column `updatedBy` on the `Receipt` table. All the data in the column will be lost.
  - The primary key for the `Tenant` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `email` on the `Tenant` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `Tenant` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(64)`.
  - You are about to drop the `Document` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExpenseAllocation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ExpensePoolItem` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `FileObject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Installment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Lease` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Pdc` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReceiptAllocation` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Statement` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tenantId,code]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,code]` on the table `ExpensePool` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,key]` on the table `IdempotencyKey` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[installmentId]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,code]` on the table `Invoice` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,propertyId,customerId,startDate]` on the table `Ownership` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,code]` on the table `Property` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `code` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fullName` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `incurredAt` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `ExpensePool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `ExpensePool` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subtotal` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `total` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Ownership` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Ownership` table without a default value. This is not possible if the table is not empty.
  - Added the required column `code` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Property` table without a default value. This is not possible if the table is not empty.
  - Added the required column `invoiceId` to the `Receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `method` to the `Receipt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receivedAt` to the `Receipt` table without a default value. This is not possible if the table is not empty.
  - Made the column `tenantId` on table `Receipt` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `updatedAt` to the `Tenant` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'PENDING', 'PARTIAL', 'PAID', 'VOID');

-- CreateEnum
CREATE TYPE "ReceiptMethod" AS ENUM ('CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'PDC');

-- CreateEnum
CREATE TYPE "PdcStatus" AS ENUM ('RECEIVED', 'DEPOSITED', 'CLEARED', 'BOUNCED', 'RETURNED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransferType" AS ENUM ('SALE', 'GIFT', 'INHERITANCE', 'INTERNAL');

-- CreateEnum
CREATE TYPE "CommChannel" AS ENUM ('EMAIL', 'SMS', 'PHONE', 'WHATSAPP', 'NOTE');

-- DropForeignKey
ALTER TABLE "ExpenseAllocation" DROP CONSTRAINT "ExpenseAllocation_poolId_fkey";

-- DropForeignKey
ALTER TABLE "ExpenseAllocation" DROP CONSTRAINT "ExpenseAllocation_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "ExpensePoolItem" DROP CONSTRAINT "ExpensePoolItem_expenseId_fkey";

-- DropForeignKey
ALTER TABLE "ExpensePoolItem" DROP CONSTRAINT "ExpensePoolItem_poolId_fkey";

-- DropForeignKey
ALTER TABLE "Installment" DROP CONSTRAINT "Installment_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "Installment" DROP CONSTRAINT "Installment_leaseId_fkey";

-- DropForeignKey
ALTER TABLE "Installment" DROP CONSTRAINT "Installment_statementId_fkey";

-- DropForeignKey
ALTER TABLE "Installment" DROP CONSTRAINT "Installment_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Lease" DROP CONSTRAINT "Lease_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "Ownership" DROP CONSTRAINT "Ownership_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Ownership" DROP CONSTRAINT "Ownership_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Pdc" DROP CONSTRAINT "Pdc_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Pdc" DROP CONSTRAINT "Pdc_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_customerId_fkey";

-- DropForeignKey
ALTER TABLE "Receipt" DROP CONSTRAINT "Receipt_propertyId_fkey";

-- DropForeignKey
ALTER TABLE "ReceiptAllocation" DROP CONSTRAINT "ReceiptAllocation_invoiceId_fkey";

-- DropForeignKey
ALTER TABLE "ReceiptAllocation" DROP CONSTRAINT "ReceiptAllocation_receiptId_fkey";

-- DropIndex
DROP INDEX "Customer_nic_key";

-- DropIndex
DROP INDEX "Expense_type_date_idx";

-- DropIndex
DROP INDEX "IdempotencyKey_key_scope_key";

-- DropIndex
DROP INDEX "Invoice_customerId_idx";

-- DropIndex
DROP INDEX "Invoice_propertyId_status_idx";

-- DropIndex
DROP INDEX "Ownership_propertyId_status_idx";

-- DropIndex
DROP INDEX "Property_plotNo_key";

-- DropIndex
DROP INDEX "Receipt_propertyId_status_idx";

-- DropIndex
DROP INDEX "Receipt_tenantId_idx";

-- DropIndex
DROP INDEX "Tenant_email_key";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "address",
DROP COLUMN "guardianName",
DROP COLUMN "name",
DROP COLUMN "nic",
DROP COLUMN "nomineeJson",
DROP COLUMN "phones",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "fullName" TEXT NOT NULL,
ADD COLUMN     "nationalId" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Expense" DROP COLUMN "billNo",
DROP COLUMN "category",
DROP COLUMN "costCenter",
DROP COLUMN "date",
DROP COLUMN "net",
DROP COLUMN "project",
DROP COLUMN "subcategory",
DROP COLUMN "tax",
DROP COLUMN "type",
DROP COLUMN "updatedAt",
DROP COLUMN "vendor",
ADD COLUMN     "incurredAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "poolId" TEXT,
ADD COLUMN     "propertyId" TEXT,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,2);

-- AlterTable
ALTER TABLE "ExpensePool" DROP COLUMN "fromDate",
DROP COLUMN "method",
DROP COLUMN "notes",
DROP COLUMN "scopeBlock",
DROP COLUMN "status",
DROP COLUMN "toDate",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "IdempotencyKey" DROP COLUMN "response",
DROP COLUMN "scope",
DROP COLUMN "updatedAt",
ADD COLUMN     "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "resourceKey" TEXT;

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "amount",
DROP COLUMN "notes",
DROP COLUMN "seq",
DROP COLUMN "type",
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'PKR',
ADD COLUMN     "installmentId" TEXT,
ADD COLUMN     "paid" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "subtotal" DECIMAL(14,2) NOT NULL,
ADD COLUMN     "tax" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "total" DECIMAL(14,2) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Ownership" DROP COLUMN "fromDate",
DROP COLUMN "status",
DROP COLUMN "toDate",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "startDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Property" DROP COLUMN "block",
DROP COLUMN "flagsJson",
DROP COLUMN "plotNo",
DROP COLUMN "sizeYd2",
DROP COLUMN "status",
DROP COLUMN "type",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "code" TEXT NOT NULL,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "sizeSqYd" DECIMAL(12,2),
ADD COLUMN     "tenantId" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Receipt" DROP COLUMN "createdBy",
DROP COLUMN "date",
DROP COLUMN "instrument",
DROP COLUMN "mode",
DROP COLUMN "propertyId",
DROP COLUMN "seq",
DROP COLUMN "status",
DROP COLUMN "updatedAt",
DROP COLUMN "updatedBy",
ADD COLUMN     "invoiceId" TEXT NOT NULL,
ADD COLUMN     "method" "ReceiptMethod" NOT NULL,
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "receivedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "reference" TEXT,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(14,2),
ALTER COLUMN "tenantId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Tenant" DROP CONSTRAINT "Tenant_pkey",
DROP COLUMN "email",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" SET DATA TYPE VARCHAR(64),
ADD CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id");

-- DropTable
DROP TABLE "Document";

-- DropTable
DROP TABLE "ExpenseAllocation";

-- DropTable
DROP TABLE "ExpensePoolItem";

-- DropTable
DROP TABLE "FileObject";

-- DropTable
DROP TABLE "Installment";

-- DropTable
DROP TABLE "Lease";

-- DropTable
DROP TABLE "Pdc";

-- DropTable
DROP TABLE "ReceiptAllocation";

-- DropTable
DROP TABLE "Statement";

-- DropEnum
DROP TYPE "DocumentType";

-- DropEnum
DROP TYPE "InstallmentStatus";

-- DropEnum
DROP TYPE "LeaseFrequency";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnershipTransfer" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "fromCustomer" TEXT NOT NULL,
    "toCustomer" TEXT NOT NULL,
    "transferType" "TransferType" NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnershipTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentPlan" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PKR',
    "startDate" TIMESTAMP(3) NOT NULL,
    "expectedTerms" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanInstallment" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanInstallment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecoveryCharge" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "chargeDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecoveryCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostDatedCheque" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "bank" TEXT,
    "chequeNo" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "PdcStatus" NOT NULL DEFAULT 'RECEIVED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PostDatedCheque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Communication" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "propertyId" TEXT,
    "invoiceId" TEXT,
    "channel" "CommChannel" NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Communication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorageObject" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "sha256" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL,
    "url" TEXT,
    "deduped" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3),
    "mode" TEXT NOT NULL DEFAULT 's3',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StorageObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatementRun" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "storageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatementRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- CreateIndex
CREATE INDEX "OwnershipTransfer_tenantId_propertyId_idx" ON "OwnershipTransfer"("tenantId", "propertyId");

-- CreateIndex
CREATE INDEX "OwnershipTransfer_tenantId_fromCustomer_idx" ON "OwnershipTransfer"("tenantId", "fromCustomer");

-- CreateIndex
CREATE INDEX "OwnershipTransfer_tenantId_toCustomer_idx" ON "OwnershipTransfer"("tenantId", "toCustomer");

-- CreateIndex
CREATE INDEX "PaymentPlan_tenantId_propertyId_idx" ON "PaymentPlan"("tenantId", "propertyId");

-- CreateIndex
CREATE INDEX "PlanInstallment_tenantId_dueDate_idx" ON "PlanInstallment"("tenantId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "PlanInstallment_tenantId_planId_seq_key" ON "PlanInstallment"("tenantId", "planId", "seq");

-- CreateIndex
CREATE INDEX "RecoveryCharge_tenantId_propertyId_idx" ON "RecoveryCharge"("tenantId", "propertyId");

-- CreateIndex
CREATE INDEX "RecoveryCharge_tenantId_chargeDate_idx" ON "RecoveryCharge"("tenantId", "chargeDate");

-- CreateIndex
CREATE INDEX "PostDatedCheque_tenantId_dueDate_idx" ON "PostDatedCheque"("tenantId", "dueDate");

-- CreateIndex
CREATE INDEX "PostDatedCheque_tenantId_status_idx" ON "PostDatedCheque"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Communication_tenantId_createdAt_idx" ON "Communication"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "StorageObject_tenantId_sha256_idx" ON "StorageObject"("tenantId", "sha256");

-- CreateIndex
CREATE UNIQUE INDEX "StorageObject_tenantId_key_key" ON "StorageObject"("tenantId", "key");

-- CreateIndex
CREATE INDEX "StatementRun_tenantId_createdAt_idx" ON "StatementRun"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "StatementRun_tenantId_scope_idx" ON "StatementRun"("tenantId", "scope");

-- CreateIndex
CREATE INDEX "Customer_tenantId_idx" ON "Customer"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_tenantId_code_key" ON "Customer"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Expense_tenantId_incurredAt_idx" ON "Expense"("tenantId", "incurredAt");

-- CreateIndex
CREATE INDEX "Expense_tenantId_propertyId_idx" ON "Expense"("tenantId", "propertyId");

-- CreateIndex
CREATE INDEX "ExpensePool_tenantId_idx" ON "ExpensePool"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ExpensePool_tenantId_code_key" ON "ExpensePool"("tenantId", "code");

-- CreateIndex
CREATE INDEX "IdempotencyKey_tenantId_idx" ON "IdempotencyKey"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "IdempotencyKey_tenantId_key_key" ON "IdempotencyKey"("tenantId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_installmentId_key" ON "Invoice"("installmentId");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_customerId_idx" ON "Invoice"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_propertyId_idx" ON "Invoice"("tenantId", "propertyId");

-- CreateIndex
CREATE INDEX "Invoice_tenantId_status_idx" ON "Invoice"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_tenantId_code_key" ON "Invoice"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Ownership_tenantId_propertyId_idx" ON "Ownership"("tenantId", "propertyId");

-- CreateIndex
CREATE INDEX "Ownership_tenantId_customerId_idx" ON "Ownership"("tenantId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Ownership_tenantId_propertyId_customerId_startDate_key" ON "Ownership"("tenantId", "propertyId", "customerId", "startDate");

-- CreateIndex
CREATE INDEX "Property_tenantId_idx" ON "Property"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Property_tenantId_code_key" ON "Property"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Receipt_tenantId_invoiceId_idx" ON "Receipt"("tenantId", "invoiceId");

-- CreateIndex
CREATE INDEX "Receipt_tenantId_customerId_idx" ON "Receipt"("tenantId", "customerId");

-- CreateIndex
CREATE INDEX "Receipt_tenantId_receivedAt_idx" ON "Receipt"("tenantId", "receivedAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipTransfer" ADD CONSTRAINT "OwnershipTransfer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipTransfer" ADD CONSTRAINT "OwnershipTransfer_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipTransfer" ADD CONSTRAINT "OwnershipTransfer_fromCustomer_fkey" FOREIGN KEY ("fromCustomer") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipTransfer" ADD CONSTRAINT "OwnershipTransfer_toCustomer_fkey" FOREIGN KEY ("toCustomer") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentPlan" ADD CONSTRAINT "PaymentPlan_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentPlan" ADD CONSTRAINT "PaymentPlan_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanInstallment" ADD CONSTRAINT "PlanInstallment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanInstallment" ADD CONSTRAINT "PlanInstallment_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PaymentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_installmentId_fkey" FOREIGN KEY ("installmentId") REFERENCES "PlanInstallment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpensePool" ADD CONSTRAINT "ExpensePool_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "ExpensePool"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCharge" ADD CONSTRAINT "RecoveryCharge_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecoveryCharge" ADD CONSTRAINT "RecoveryCharge_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostDatedCheque" ADD CONSTRAINT "PostDatedCheque_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostDatedCheque" ADD CONSTRAINT "PostDatedCheque_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Communication" ADD CONSTRAINT "Communication_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorageObject" ADD CONSTRAINT "StorageObject_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IdempotencyKey" ADD CONSTRAINT "IdempotencyKey_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatementRun" ADD CONSTRAINT "StatementRun_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
