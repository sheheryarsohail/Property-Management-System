import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const property = await prisma.property.findFirst({ where: { code: 'R-53' } });
  if (!property) return;
  const invoices = await prisma.invoice.findMany({
    where: { propertyId: property.id }
  });
  const receipts = await prisma.receipt.findMany({
    where: { propertyId: property.id }
  });
  
  const totalInvoiced = invoices.reduce((s, i) => s + Number(i.total), 0);
  const totalRecovered = receipts.reduce((s, i) => s + Number(i.amount), 0);
  
  console.log(`R-53 Total Invoiced: ${totalInvoiced}`);
  console.log(`R-53 Total Recovered: ${totalRecovered}`);
  console.log(`R-53 Remaining Balance: ${totalInvoiced - totalRecovered}`);
}
main().then(() => prisma.$disconnect());
