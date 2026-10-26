import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const properties = await prisma.property.findMany();
  properties.forEach(p => console.log(p.code));
}
main().then(() => prisma.$disconnect());
