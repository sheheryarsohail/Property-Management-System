import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const r1 = await prisma.receipt.findFirst({ where: { code: '010759' } });
  console.log('Receipt 010759 attachments:', r1?.attachments);
  
  const r2 = await prisma.receipt.findFirst({ where: { code: '015849' } });
  console.log('Receipt 015849 attachments:', r2?.attachments);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
