import { PrismaClient, InvoiceType } from '@prisma/client';

const prisma = new PrismaClient();

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

async function main() {
  console.log('Clearing all data...');
  await prisma.tenant.deleteMany({});
  
  const tenantId = 't_local';

  await prisma.tenant.create({
    data: { id: tenantId, name: 'Local Dev Tenant' }
  });

  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.create({
    data: { email: 'admin@local.dev', name: 'Local Admin', role: 'ADMIN', tenantId, password: hashedPassword }
  });

  const customers: any[] = [];
  for (let i = 1; i <= 10; i++) {
    customers.push({
      code: `CUST-${i.toString().padStart(3, '0')}`,
      fullName: `Customer ${i}`,
      email: `customer${i}@example.com`,
      phone: `+9221345678${i.toString().padStart(2, '0')}`,
      mobile: `+9230012345${i.toString().padStart(2, '0')}`,
      nationalId: `42101-1234567-${i.toString().padStart(2, '0')}`,
      fatherName: `Father ${i}`,
      address: `Address ${i}, Karachi`,
    });
  }

  const createdCustomers = [];
  for (const c of customers) {
    const customer = await prisma.customer.create({ data: { tenantId, ...c } });
    createdCustomers.push(customer);
  }
  console.log('✅ 10 Customers created');

  const properties: any[] = [];
  for (let i = 1; i <= 20; i++) {
    properties.push({
      code: `PROP-${i.toString().padStart(3, '0')}`,
      title: `Residential Plot PROP-${i.toString().padStart(3, '0')}`,
      block: i <= 10 ? 'Block A' : 'Block B',
      sizeSqYd: 120 + (i * 10),
      type: 'RESIDENTIAL',
      status: i <= 10 ? 'SOLD' : 'AVAILABLE',
      totalPrice: 10000000 + (i * 100000),
      bookingPrice: 1000000 + (i * 10000),
      bookingMonths: 1,
      confirmationPrice: 500000 + (i * 5000),
      confirmationMonths: 1,
      installmentPrice: 100000 + (i * 1000),
      installmentMonths: 50,
      isCorner: i % 3 === 0,
      isWestOpen: i % 2 === 0,
      isRoadFacing: true,
      isParkingFacing: false,
      autoReceiptGeneration: true, 
    });
  }

  const createdProperties = [];
  for (const p of properties) {
    const property = await prisma.property.create({ data: { tenantId, ...p } });
    createdProperties.push(property);
  }
  console.log('✅ 20 Properties created');
  
  const assignDate = new Date('2018-01-01T00:00:00Z');
  let globalInvoiceCounter = 1;

  for (let i = 0; i < 10; i++) {
    const p = createdProperties[i];
    const c = createdCustomers[i];

    await prisma.ownership.create({
      data: {
        tenantId,
        propertyId: p.id,
        customerId: c.id,
        startDate: assignDate,
      }
    });

    // Generate Payment Plan, Installments and Invoices
    const components = [];
    if (p.bookingPrice && p.bookingMonths) {
      components.push({
        type: InvoiceType.BOOKING,
        amount: Number(p.bookingPrice) * Number(p.bookingMonths),
        terms: p.bookingMonths,
        startDate: assignDate,
      });
    }
    
    if (p.confirmationPrice && p.confirmationMonths) {
      components.push({
        type: InvoiceType.HALF_YEARLY, 
        amount: Number(p.confirmationPrice) * Number(p.confirmationMonths),
        terms: p.confirmationMonths,
      });
    }
    
    if (p.installmentPrice && p.installmentMonths) {
      components.push({
        type: InvoiceType.INSTALLMENT,
        amount: Number(p.installmentPrice) * Number(p.installmentMonths),
        terms: p.installmentMonths,
      });
    }

    const totalTerms = components.reduce((sum, cmp) => sum + cmp.terms, 0);

    const plan = await prisma.paymentPlan.create({
      data: {
        tenantId,
        propertyId: p.id,
        title: `Standard Plan - ${p.code}`,
        totalAmount: p.totalPrice || 0,
        currency: 'PKR',
        startDate: assignDate,
        expectedTerms: totalTerms,
      }
    });

    let seq = 1;
    let currentDate = new Date(assignDate);

    for (const component of components) {
      const componentStartDate = component.startDate ? new Date(component.startDate) : currentDate;
      const amountPerTerm = component.amount / component.terms;

      for (let j = 0; j < component.terms; j++) {
        const dueDate = addMonths(componentStartDate, j);

        const installment = await prisma.planInstallment.create({
          data: {
            tenantId,
            planId: plan.id,
            seq,
            dueDate,
            amount: amountPerTerm,
          },
        });

        const invoiceCode = `INV-${String(globalInvoiceCounter).padStart(6, '0')}`;
        globalInvoiceCounter++;

        await prisma.invoice.create({
          data: {
            tenantId,
            propertyId: p.id,
            customerId: c.id,
            installmentId: installment.id,
            code: invoiceCode,
            type: component.type,
            issueDate: new Date(), 
            dueDate: installment.dueDate,
            currency: 'PKR',
            subtotal: installment.amount,
            tax: 0,
            total: installment.amount,
            paid: 0, // Not paid yet!
            status: 'PENDING',
          },
        });

        seq++;
      }
      currentDate = addMonths(componentStartDate, component.terms);
    }
  }

  console.log('✅ 10 Properties assigned with all Installments and Invoices (no receipts)!');
  console.log('🎉 Custom Seed 2 completed successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
