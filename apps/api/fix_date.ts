import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const prop = await prisma.property.findFirst({ where: { code: 'R-172' }, include: { ownerships: true } });
  if (prop && prop.ownerships.length > 0) {
    for (const own of prop.ownerships) {
      await prisma.ownership.update({
        where: { id: own.id },
        data: { startDate: new Date('2018-10-13T00:00:00.000Z') }
      });
      console.log(`Updated ownership ${own.id} to 2018-10-13`);
    }
  } else {
    console.log('Property R-172 not found or has no ownerships');
  }
}
main().then(() => prisma.$disconnect());
