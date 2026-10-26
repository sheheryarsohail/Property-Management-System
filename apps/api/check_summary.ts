import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const invoices = await prisma.invoice.findMany();
  const receipts = await prisma.receipt.findMany();
  
  const baseInvoiced = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
  const unInvoicedReceipts = receipts.filter(r => !r.invoiceId).reduce((sum, rcp) => sum + Number(rcp.amount), 0);
  const totalInvoiced = baseInvoiced + unInvoicedReceipts;
  const totalRecovered = receipts.reduce((sum, rcp) => sum + Number(rcp.amount), 0);
  
  console.log({
    baseInvoiced,
    unInvoicedReceipts,
    totalInvoiced,
    totalRecovered,
    pendingReceivables: Math.max(0, totalInvoiced - totalRecovered)
  });
}
main().then(() => prisma.$disconnect());
