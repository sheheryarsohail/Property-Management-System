-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "guardianName" TEXT,
    "nic" TEXT NOT NULL,
    "phones" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "address" TEXT,
    "nomineeJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "plotNo" TEXT NOT NULL,
    "sizeYd2" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "block" TEXT,
    "flagsJson" JSONB,
    "status" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ownership" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3),
    "status" TEXT NOT NULL,

    CONSTRAINT "Ownership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "customerId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "mode" TEXT NOT NULL,
    "instrument" JSONB,
    "amount" DECIMAL(14,2) NOT NULL,
    "status" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceiptAllocation" (
    "id" TEXT NOT NULL,
    "receiptId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "ReceiptAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pdc" (
    "id" TEXT NOT NULL,
    "chequeNo" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "branch" TEXT,
    "amount" DECIMAL(14,2) NOT NULL,
    "chequeDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "linkedInvoiceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "customerId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "Pdc_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_nic_key" ON "Customer"("nic");

-- CreateIndex
CREATE UNIQUE INDEX "Property_plotNo_key" ON "Property"("plotNo");

-- CreateIndex
CREATE INDEX "Ownership_propertyId_status_idx" ON "Ownership"("propertyId", "status");

-- CreateIndex
CREATE INDEX "Invoice_propertyId_status_idx" ON "Invoice"("propertyId", "status");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Receipt_propertyId_status_idx" ON "Receipt"("propertyId", "status");

-- CreateIndex
CREATE INDEX "ReceiptAllocation_invoiceId_idx" ON "ReceiptAllocation"("invoiceId");

-- CreateIndex
CREATE INDEX "Pdc_status_chequeDate_idx" ON "Pdc"("status", "chequeDate");

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ownership" ADD CONSTRAINT "Ownership_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptAllocation" ADD CONSTRAINT "ReceiptAllocation_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "Receipt"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptAllocation" ADD CONSTRAINT "ReceiptAllocation_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pdc" ADD CONSTRAINT "Pdc_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pdc" ADD CONSTRAINT "Pdc_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
