import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const property = await prisma.property.findFirst({ where: { code: 'R-53' } });
  if (!property) return console.log('Property R-53 not found');

  const uninvoicedReceipts = await prisma.receipt.findMany({
    where: { propertyId: property.id, invoiceId: null },
    orderBy: { receivedAt: 'asc' }
  });
  console.log(`Found ${uninvoicedReceipts.length} uninvoiced receipts for R-53`);

  const unpaidInvoices = await prisma.invoice.findMany({
    where: { propertyId: property.id, status: { not: 'PAID' } },
    orderBy: { issueDate: 'asc' }
  });
  console.log(`Found ${unpaidInvoices.length} unpaid invoices for R-53`);

  for (const receipt of uninvoicedReceipts) {
    let amountLeft = Number(receipt.amount);
    
    for (const invoice of unpaidInvoices) {
      const balance = Number(invoice.total) - Number(invoice.paid);
      if (balance > 0 && amountLeft > 0) {
        const amountToApply = Math.min(balance, amountLeft);
        
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            paid: { increment: amountToApply },
            status: Number(invoice.paid) + amountToApply >= Number(invoice.total) ? 'PAID' : invoice.status
          }
        });
        
        // update local object so next loop sees it
        (invoice as any).paid = Number(invoice.paid) + amountToApply;
        amountLeft -= amountToApply;
        
        await prisma.receipt.update({
          where: { id: receipt.id },
          data: { invoiceId: invoice.id }
        });
        
        console.log(`Applied ${amountToApply} from receipt ${receipt.code} to invoice ${invoice.code}`);
        
        if (amountLeft === 0) break;
      }
    }
  }
  
  console.log('Adjustment complete');
}
main().then(() => prisma.$disconnect());
