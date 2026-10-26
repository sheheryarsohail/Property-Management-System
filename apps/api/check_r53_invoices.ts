import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const unpaid = await prisma.invoice.findMany({
    where: { property: { code: 'R-53' } },
  });
  
  const unpaidFiltered = unpaid.filter(i => Number(i.paid) < Number(i.total));
  console.log('Total invoices:', unpaid.length);
  console.log('Unpaid invoices count:', unpaidFiltered.length);
  console.log(unpaidFiltered.map(i => ({ code: i.code, total: Number(i.total), paid: Number(i.paid), status: i.status })));
}
main().then(() => prisma.$disconnect());
