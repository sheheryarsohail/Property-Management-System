import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const property = await prisma.property.findFirst({ where: { code: 'R-53' } });
  if (!property) throw new Error('Property R-53 not found');

  // 1. Fetch all invoices ordered by current due date
  const invoices = await prisma.invoice.findMany({
    where: { propertyId: property.id },
    orderBy: { dueDate: 'asc' }
  });

  // 2. Reset paid, status, and update dueDate
  let currentDate = new Date('2018-11-10T00:00:00Z');
  
  for (let i = 0; i < invoices.length; i++) {
    const inv = invoices[i];
    await prisma.invoice.update({
      where: { id: inv.id },
      data: {
        paid: 0,
        status: 'PENDING',
        dueDate: new Date(currentDate),
        issueDate: new Date(currentDate)
      }
    });

    const currentMonth = currentDate.getUTCMonth();
    currentDate.setUTCMonth(currentMonth + 1);
  }

  // 3. Fetch all receipts for R-53
  const receipts = await prisma.receipt.findMany({
    where: { propertyId: property.id }
  });

  let totalPaid = 0;
  for (const r of receipts) {
    totalPaid += Number(r.amount);
  }
  console.log(`Total receipts amount for R-53: ${totalPaid}`);

  // 4. Waterfall allocate
  let remaining = totalPaid;
  const updatedInvoices = await prisma.invoice.findMany({
    where: { propertyId: property.id },
    orderBy: { dueDate: 'asc' }
  });

  for (const inv of updatedInvoices) {
    if (remaining <= 0) break;
    
    const balance = Number(inv.total);
    const allocate = Math.min(remaining, balance);
    remaining -= allocate;
    const isPaid = allocate >= balance;

    await prisma.invoice.update({
      where: { id: inv.id },
      data: {
        paid: allocate,
        status: isPaid ? 'PAID' : 'PARTIAL'
      }
    });
  }

  console.log('R-53 fully fixed!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
