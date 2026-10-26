import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const transfer = await prisma.ownershipTransfer.findUnique({
    where: { id: 'cmsuccewt001571m8rk6wq875' }
  });
  
  if (!transfer) return console.log('Transfer not found');
  
  try {
    await prisma.$transaction(async (tx) => {
      await tx.invoice.updateMany({
        where: {
          tenantId: transfer.tenantId,
          propertyId: transfer.propertyId,
          customerId: transfer.fromCustomer,
          status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
        },
        data: {
          customerId: transfer.toCustomer,
        },
      });

      await tx.ownership.updateMany({
        where: {
          tenantId: transfer.tenantId,
          propertyId: transfer.propertyId,
          endDate: null,
        },
        data: {
          endDate: transfer.transferDate,
        },
      });

      await tx.ownership.create({
        data: {
          tenantId: transfer.tenantId,
          propertyId: transfer.propertyId,
          customerId: transfer.toCustomer,
          startDate: transfer.transferDate,
        },
      });

      return tx.ownershipTransfer.update({
        where: { id: transfer.id },
        data: {
          status: 'APPROVED',
          duesCleared: false,
          adminOverride: false,
        },
      });
    });
    console.log('Approve successful');
  } catch (e) {
    console.error('Approve failed:', e);
  }
}
main().then(() => prisma.$disconnect());
