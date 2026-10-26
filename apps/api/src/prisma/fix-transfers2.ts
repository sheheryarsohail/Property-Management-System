import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Reverting PAID invoices back to original owners...');
  const approvedTransfers = await prisma.ownershipTransfer.findMany({
    where: { status: 'APPROVED' },
    orderBy: { transferDate: 'asc' }
  });

  console.log(`Found ${approvedTransfers.length} approved transfers.`);

  for (const transfer of approvedTransfers) {
    // Find paid invoices for this property that currently belong to the new owner
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        propertyId: transfer.propertyId,
        customerId: transfer.toCustomer,
        status: 'PAID'
      },
      include: { receipts: true }
    });

    let restoredCount = 0;
    for (const invoice of paidInvoices) {
      // Check if any receipt belongs to the old owner
      const hasOldOwnerReceipt = invoice.receipts.some(r => r.customerId === transfer.fromCustomer);
      
      if (hasOldOwnerReceipt) {
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { customerId: transfer.fromCustomer }
        });
        restoredCount++;
      }
    }
    console.log(`Restored ${restoredCount} PAID invoices for property ${transfer.propertyId} back to ${transfer.fromCustomer}.`);
  }

  console.log('Done.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
