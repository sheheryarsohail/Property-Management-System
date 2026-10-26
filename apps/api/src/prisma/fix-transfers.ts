import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing invoices for approved transfers...');
  const approvedTransfers = await prisma.ownershipTransfer.findMany({
    where: { status: 'APPROVED' },
    orderBy: { transferDate: 'asc' } // Process in chronological order
  });

  console.log(`Found ${approvedTransfers.length} approved transfers.`);

  for (const transfer of approvedTransfers) {
    const { count } = await prisma.invoice.updateMany({
      where: {
        propertyId: transfer.propertyId,
        customerId: transfer.fromCustomer,
      },
      data: {
        customerId: transfer.toCustomer,
      }
    });
    console.log(`Updated ${count} invoices for property ${transfer.propertyId} from ${transfer.fromCustomer} to ${transfer.toCustomer}.`);
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
