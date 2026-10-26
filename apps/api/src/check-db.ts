import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const invoice = await prisma.invoice.findFirst({
    where: { code: 'INV-002550' }
  });
  console.log('Invoice:', invoice);
  
  const allInvoicesCount = await prisma.invoice.count();
  console.log('Total invoices:', allInvoicesCount);
  
  const tenants = await prisma.invoice.groupBy({
    by: ['tenantId'],
    _count: true
  });
  console.log('Tenants in Invoices:', tenants);

  const expenses = await prisma.expense.count();
  console.log('Total expenses:', expenses);

  const expenseTenants = await prisma.expense.groupBy({
    by: ['tenantId'],
    _count: true
  });
  console.log('Tenants in Expenses:', expenseTenants);
}

check().catch(console.error).finally(() => prisma.$disconnect());
