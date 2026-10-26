import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const invoices = await prisma.invoice.findMany({ include: { receipts: true } });
  
  let totalDiscrepancy = 0;
  for (const inv of invoices) {
    const receiptSum = inv.receipts.reduce((s, r) => s + Number(r.amount), 0);
    const paid = Number(inv.paid);
    if (paid !== receiptSum) {
      console.log(`Invoice ${inv.code}: paid=${paid}, receipts=${receiptSum}`);
      totalDiscrepancy += (paid - receiptSum);
    }
  }
  console.log('Total discrepancy:', totalDiscrepancy);
}
main().then(() => prisma.$disconnect());
