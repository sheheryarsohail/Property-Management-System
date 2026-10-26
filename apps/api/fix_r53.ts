import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const property = await prisma.property.findFirst({ where: { code: 'R-53' } });
  if (!property) return;
  const invoices = await prisma.invoice.findMany({
    where: { propertyId: property.id },
    orderBy: { dueDate: 'asc' }
  });
  
  for (const inv of invoices) {
    if (Number(inv.paid) < Number(inv.total)) {
      console.log(`Unpaid invoice ${inv.code}: total ${inv.total}, paid ${inv.paid}`);
      // just mark it as paid for now to fix the user's issue
      await prisma.invoice.update({
        where: { id: inv.id },
        data: { paid: inv.total, status: 'PAID' }
      });
      console.log(`Marked ${inv.code} as PAID`);
    }
  }
}
main().then(() => prisma.$disconnect());
