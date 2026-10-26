import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fixing propertyId for existing receipts...');
  
  const receipts = await prisma.receipt.findMany({
    where: { propertyId: null, invoiceId: { not: null } },
  });

  console.log(`Found ${receipts.length} receipts to fix.`);

  for (const receipt of receipts) {
    if (receipt.invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: receipt.invoiceId },
      });
      if (invoice && invoice.propertyId) {
        await prisma.receipt.update({
          where: { id: receipt.id },
          data: { propertyId: invoice.propertyId },
        });
        console.log(`Updated receipt ${receipt.code} with propertyId ${invoice.propertyId}`);
      }
    }
  }

  console.log('✅ Done fixing receipts!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
