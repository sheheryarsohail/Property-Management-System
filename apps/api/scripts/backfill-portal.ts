import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany({
    where: {
      portalAccessId: null,
    },
  });

  console.log(`Found ${customers.length} customers missing portalAccessId. Updating...`);

  let count = 0;
  for (const customer of customers) {
    await prisma.customer.update({
      where: { id: customer.id },
      data: { portalAccessId: crypto.randomUUID() },
    });
    count++;
  }

  console.log(`Successfully generated portalAccessId for ${count} customers.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
