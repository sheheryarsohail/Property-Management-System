import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const property = await prisma.property.findFirst({ where: { code: 'R-56' } });
  if (!property) return console.log('Property R-56 not found');

  const invoices = await prisma.invoice.findMany({
    where: { propertyId: property.id },
    orderBy: { issueDate: 'asc' }
  });
  
  const receipts = await prisma.receipt.findMany({
    where: { propertyId: property.id },
    orderBy: { receivedAt: 'asc' }
  });
  
  let totalInvoiced = 0;
  let totalPaid = 0;
  let arrears = 0;
  
  invoices.forEach(inv => {
    totalInvoiced += Number(inv.total);
    totalPaid += Number(inv.paid);
    const balance = Number(inv.total) - Number(inv.paid);
    if (balance > 0 && new Date(inv.dueDate) < new Date()) {
      arrears += balance;
    }
    console.log(`Invoice ${inv.code}: total=${inv.total}, paid=${inv.paid}, status=${inv.status}, type=${inv.type}`);
  });
  
  const receiptTotal = receipts.reduce((sum, r) => sum + Number(r.amount), 0);
  
  console.log('--- Summary ---');
  console.log(`Invoices Total: ${totalInvoiced}`);
  console.log(`Invoices Paid: ${totalPaid}`);
  console.log(`Receipts Total: ${receiptTotal}`);
  console.log(`Calculated Arrears: ${arrears}`);
}
main().then(() => prisma.$disconnect());
