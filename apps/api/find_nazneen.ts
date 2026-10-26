import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const c = await prisma.customer.findMany({ where: { fullName: { contains: 'Nazneen' } } });
  console.log(c);
}
main().then(() => prisma.$disconnect());
