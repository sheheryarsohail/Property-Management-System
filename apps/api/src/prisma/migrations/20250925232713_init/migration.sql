-- AlterTable
ALTER TABLE "Invoice" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Pdc" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Receipt" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- AlterTable
ALTER TABLE "ReceiptAllocation" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(65,30);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "subcategory" TEXT,
    "vendor" TEXT,
    "billNo" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "tax" DECIMAL(65,30),
    "net" DECIMAL(65,30),
    "costCenter" TEXT,
    "project" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpensePool" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "scopeBlock" TEXT,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExpensePool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpensePoolItem" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,

    CONSTRAINT "ExpensePoolItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseAllocation" (
    "id" TEXT NOT NULL,
    "poolId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "basis" TEXT,
    "shareBasis" DECIMAL(65,30),
    "amount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ExpenseAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Expense_type_date_idx" ON "Expense"("type", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ExpensePoolItem_poolId_expenseId_key" ON "ExpensePoolItem"("poolId", "expenseId");

-- CreateIndex
CREATE INDEX "ExpenseAllocation_poolId_idx" ON "ExpenseAllocation"("poolId");

-- CreateIndex
CREATE INDEX "ExpenseAllocation_propertyId_idx" ON "ExpenseAllocation"("propertyId");

-- AddForeignKey
ALTER TABLE "ExpensePoolItem" ADD CONSTRAINT "ExpensePoolItem_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "ExpensePool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpensePoolItem" ADD CONSTRAINT "ExpensePoolItem_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseAllocation" ADD CONSTRAINT "ExpenseAllocation_poolId_fkey" FOREIGN KEY ("poolId") REFERENCES "ExpensePool"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseAllocation" ADD CONSTRAINT "ExpenseAllocation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
