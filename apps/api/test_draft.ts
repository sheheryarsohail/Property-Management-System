import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.ownershipTransfer.update({
    where: { id: 'cmsuccewt001571m8rk6wq875' },
    data: { status: 'DRAFT' }
  });
}
main().then(() => prisma.$disconnect());
