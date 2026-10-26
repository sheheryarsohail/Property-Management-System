import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.customer.deleteMany({ where: { fullName: { contains: 'Nazneen' } } });
  console.log('Deleted Nazneen.');
}
main().then(() => prisma.$disconnect());
