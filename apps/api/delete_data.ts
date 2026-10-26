import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting data deletion...');
  
  // 1. Delete Properties R-100, R-54, R-40
  // Deleting a property with Cascade rules will delete its ownerships, plans, installments, receipts, etc.
  const propertiesToDelete = ['R-100', 'R-54', 'R-40'];
  for (const code of propertiesToDelete) {
    const prop = await prisma.property.findFirst({ where: { code } });
    if (prop) {
      console.log(`Deleting property ${code} (ID: ${prop.id})...`);
      await prisma.property.delete({ where: { id: prop.id } });
    } else {
      console.log(`Property ${code} not found.`);
    }
  }

  // 2. Delete Customers "Yasir Ali", "Nazneen Bani"
  const customersToDelete = ['Yasir Ali', 'Nazneen Bani'];
  for (const name of customersToDelete) {
    const customer = await prisma.customer.findFirst({
      where: { 
        OR: [
          { fullName: { contains: name } }
        ]
      }
    } as any);
    
    if (customer) {
      console.log(`Deleting customer ${name} (ID: ${customer.id})...`);
      await prisma.customer.delete({ where: { id: customer.id } });
    } else {
      console.log(`Customer ${name} not found.`);
    }
  }
  
  console.log('Data deletion complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
