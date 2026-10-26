import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const properties = await prisma.property.findMany({
    where: { code: { contains: 'r-06', mode: 'insensitive' } },
    include: {
      ownerships: { include: { customer: true } }
    }
  });

  console.log("Found properties matching r-06:");
  for (const property of properties) {
    console.log(`Property ID: ${property.id}, Code: ${property.code}, Title: ${property.title}, Tenant: ${property.tenantId}`);
    console.log("Ownerships:");
    property.ownerships.forEach(o => console.log(`  Owner: ${o.customer.fullName} (${o.customerId}), Start: ${o.startDate}, End: ${o.endDate}`));
  }

  const ayeshaList = await prisma.customer.findMany({ where: { fullName: { contains: 'Ayesha Noor', mode: 'insensitive' } } });
  
  if (ayeshaList.length > 0) {
    const ayeshaId = ayeshaList[0].id;
    const r06 = properties.find(p => p.code === 'R-06');
    if (r06) {
      const ayeshaInvoicesR06 = await prisma.invoice.count({ where: { customerId: ayeshaId, propertyId: r06.id } });
      const ayeshaReceiptsR06 = await prisma.receipt.count({ where: { customerId: ayeshaId, propertyId: r06.id } });
      console.log(`Invoices for Ayesha in R-06: ${ayeshaInvoicesR06}`);
      console.log(`Receipts for Ayesha in R-06: ${ayeshaReceiptsR06}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
