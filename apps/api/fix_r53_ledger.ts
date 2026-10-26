import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const property = await prisma.property.findFirst({ where: { code: 'R-53' } });
  if (!property) return console.log('Property R-53 not found');

  // Step 1: Re-sync all invoice.paid based on their actual linked receipts
  const invoices = await prisma.invoice.findMany({
    where: { propertyId: property.id },
    include: { receipts: true },
    orderBy: { issueDate: 'asc' }
  });

  for (const inv of invoices) {
    const actualPaid = inv.receipts.reduce((sum, r) => sum + Number(r.amount), 0);
    let status = inv.status;
    if (actualPaid === 0) status = 'PENDING';
    else if (actualPaid < Number(inv.total)) status = 'PARTIAL';
    else status = 'PAID';
    
    await prisma.invoice.update({
      where: { id: inv.id },
      data: { paid: actualPaid, status }
    });
    
    // Update local object for step 2
    (inv as any).paid = actualPaid;
    inv.status = status;
  }
  
  console.log('Re-synced all invoice.paid amounts.');

  // Step 2: Apply uninvoiced receipts
  const uninvoicedReceipts = await prisma.receipt.findMany({
    where: { propertyId: property.id, invoiceId: null },
    orderBy: { receivedAt: 'asc' }
  });

  for (const receipt of uninvoicedReceipts) {
    let amountLeft = Number(receipt.amount);
    
    // Refresh unpaid invoices
    const unpaidInvoices = await prisma.invoice.findMany({
      where: { propertyId: property.id, status: { not: 'PAID' } },
      orderBy: { issueDate: 'asc' }
    });
    
    for (const invoice of unpaidInvoices) {
      const balance = Number(invoice.total) - Number(invoice.paid);
      if (balance > 0 && amountLeft > 0) {
        const amountToApply = Math.min(balance, amountLeft);
        
        await prisma.invoice.update({
          where: { id: invoice.id },
          data: {
            paid: { increment: amountToApply },
            status: Number(invoice.paid) + amountToApply >= Number(invoice.total) ? 'PAID' : 'PARTIAL'
          }
        });
        
        await prisma.receipt.update({
          where: { id: receipt.id },
          data: { invoiceId: invoice.id }
        });
        
        console.log(`Applied ${amountToApply} from receipt ${receipt.code} to invoice ${invoice.code}`);
        
        amountLeft -= amountToApply;
        if (amountLeft === 0) break;
      }
    }
  }

  console.log('Fixed R-53 ledger successfully.');
}
main().then(() => prisma.$disconnect());
