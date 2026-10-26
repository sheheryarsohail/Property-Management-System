import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const properties = ['R-53', 'R-172', 'R-176', 'R-177'];
  
  for (const code of properties) {
    const property = await prisma.property.findFirst({ where: { code } });
    if (!property) continue;
    
    const invoices = await prisma.invoice.findMany({
      where: { propertyId: property.id, status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } }
    });
    
    let arrears = 0;
    for (const inv of invoices) {
      const balance = Number(inv.total) - Number(inv.paid);
      if (balance > 0 && new Date(inv.dueDate) < new Date()) {
        arrears += balance;
      }
    }
    
    console.log(`${code} arrears: ${arrears}, total unpaid invoices: ${invoices.length}`);
  }
}
main().then(() => prisma.$disconnect());
