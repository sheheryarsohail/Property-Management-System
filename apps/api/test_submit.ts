import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const transferId = 'cmsuccewt001571m8rk6wq875'; // ID from the logs
  const transfer = await prisma.ownershipTransfer.findUnique({ where: { id: transferId } });
  console.log('Transfer status:', transfer?.status);
  
  if (transfer?.status === 'DRAFT') {
    try {
      await prisma.ownershipTransfer.update({
        where: { id: transferId },
        data: { status: 'SUBMITTED' }
      });
      console.log('Updated to SUBMITTED successfully');
    } catch (e) {
      console.error('Update error:', e);
    }
  }
}
main().then(() => prisma.$disconnect());
