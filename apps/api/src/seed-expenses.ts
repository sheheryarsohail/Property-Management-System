import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding sample expenses...');

  // 1. Find a valid tenant
  const property = await prisma.property.findFirst();
  if (!property) {
    console.log('No property found to infer tenantId');
    return;
  }
  const tenantId = property.tenantId;
  console.log('Using tenantId:', tenantId);

  // 2. Generate random expenses from Sept 2018 to today
  const categories = ['OFFICE', 'DEVELOPMENT'];
  const startDate = new Date('2018-09-01T00:00:00.000Z');
  const endDate = new Date(); // today

  const numExpenses = 50; // Add 50 sample expenses

  for (let i = 0; i < numExpenses; i++) {
    // Random date between start and end
    const randomTime = startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime());
    const randomDate = new Date(randomTime);
    
    // Random category
    const category = categories[Math.floor(Math.random() * categories.length)];
    
    // Random amount (e.g. between 5,000 and 150,000 PKR)
    const amount = Math.floor(Math.random() * 145000) + 5000;

    await prisma.expense.create({
      data: {
        tenantId,
        title: `Expense for ${category}`,
        type: 'PETTY_CASH',
        amount,
        category,
        incurredAt: randomDate,
      }
    });
  }

  console.log(`Successfully added ${numExpenses} expenses from Sept 2018 onwards.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
