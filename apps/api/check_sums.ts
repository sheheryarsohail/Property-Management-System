import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const invoices = await prisma.invoice.findMany();
  
  const invTotal = invoices.reduce((s, i) => s + Number(i.total), 0);
  const invPaid = invoices.reduce((s, i) => s + Number(i.paid), 0);
  console.log('Total across all invoices:', invTotal);
  console.log('Paid across all invoices:', invPaid);
}
main().then(() => prisma.$disconnect());
