import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  try {
    const transfer = await prisma.ownershipTransfer.findFirst({
      where: { id: 'cmsuccewt001571m8rk6wq875' },
      include: {
        property: true,
        from: true,
        to: true,
      },
    });
    console.log('Success:', transfer?.id);
  } catch (e) {
    console.error('Error:', e);
  }
}
main().then(() => prisma.$disconnect());
