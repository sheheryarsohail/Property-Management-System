import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const property = await prisma.property.findFirst({ where: { code: 'R-53' } });
  if (!property) return console.log('Property R-53 not found');

  const invoices = await prisma.invoice.findMany({ where: { propertyId: property.id } });
  const receipts = await prisma.receipt.findMany({ where: { propertyId: property.id } });
  
  const invTotal = invoices.reduce((s, i) => s + Number(i.total), 0);
  const invPaid = invoices.reduce((s, i) => s + Number(i.paid), 0);
  const rcpTotal = receipts.reduce((s, r) => s + Number(r.amount), 0);
  
  console.log('R-53 Invoices Total:', invTotal);
  console.log('R-53 Invoices Paid:', invPaid);
  console.log('R-53 Receipts Total:', rcpTotal);
  console.log('Invoices:', invoices.map(i => ({ id: i.id, code: i.code, total: Number(i.total), paid: Number(i.paid) })));
  console.log('Receipts:', receipts.map(r => ({ id: r.id, code: r.code, amount: Number(r.amount), invoiceId: r.invoiceId })));
}
main().then(() => prisma.$disconnect());
