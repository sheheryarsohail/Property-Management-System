import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const receipts = await prisma.receipt.findMany({
    select: { id: true, code: true, amount: true, chequeNumber: true, reference: true }
  });
  console.log('All receipts:', receipts);
}
main().then(() => prisma.$disconnect());
