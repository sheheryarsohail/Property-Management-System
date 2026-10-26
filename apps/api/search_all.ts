import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const inv = await prisma.invoice.findMany({ where: { code: { contains: '02066311' } } });
  const pdc = await prisma.postDatedCheque.findMany({ where: { chequeNo: { contains: '02066311' } } });
  console.log('Invoices:', inv);
  console.log('PDCs:', pdc);
}
main().then(() => prisma.$disconnect());
