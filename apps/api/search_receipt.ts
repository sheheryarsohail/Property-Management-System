import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const receipts = await prisma.receipt.findMany({
    where: {
      OR: [
        { code: { contains: '02066311' } },
        { chequeNumber: { contains: '02066311' } },
        { slipNumber: { contains: '02066311' } },
        { reference: { contains: '02066311' } }
      ]
    }
  });
  console.log(receipts);
}
main().then(() => prisma.$disconnect());
