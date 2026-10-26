import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const cust = await prisma.customer.findFirst({ where: { tenantId: 't_local' } });
    if (!cust) return console.log('No customer');
    
    console.log('Creating PDC...');
    const pdc = await prisma.postDatedCheque.create({
      data: {
        tenantId: 't_local',
        customerId: cust.id,
        amount: 500,
        dueDate: new Date(),
        status: 'RECEIVED',
      }
    });
    console.log('Created PDC:', pdc.id);

    console.log('Depositing PDC...');
    const res = await prisma.postDatedCheque.update({
      where: { id: pdc.id },
      data: { status: 'DEPOSITED' }
    });
    console.log('Deposited successfully:', res.id);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
