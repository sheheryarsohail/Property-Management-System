import { PrismaClient } from '@prisma/client';
import { addMonths, startOfMonth, subMonths } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  const tenantId = 't_local';

  // Make sure tenant exists
  await prisma.tenant.upsert({
    where: { id: tenantId },
    create: { id: tenantId, name: 'Local Dev Tenant' },
    update: {},
  });

  // ---------------------------------------------------------
  // 1. Create Customers (Karachi Data)
  // ---------------------------------------------------------
  const customers = [
    {
      code: 'CUST-001',
      fullName: 'Muhammad Ali',
      email: 'm.ali@example.com',
      phone: '+922134567890',
      mobile: '+923001234567',
      nationalId: '42101-1234567-1',
      fatherName: 'Tariq Ali',
      address: 'House 45, Street 12, DHA Phase 8, Karachi',
    },
    {
      code: 'CUST-002',
      fullName: 'Fatima Ahmed',
      email: 'fatima.ahmed@example.com',
      phone: '+922139876543',
      mobile: '+923339876543',
      nationalId: '42201-9876543-2',
      fatherName: 'Syed Ahmed',
      address: 'Apartment 302, Sea View Residency, Clifton, Karachi',
    },
    {
      code: 'CUST-003',
      fullName: 'Usman Khan',
      email: 'usman.k@example.com',
      phone: '+922131112222',
      mobile: '+923451112222',
      nationalId: '42301-1112222-3',
      fatherName: 'Salman Khan',
      address: 'Bangalow A-12, Block 4, Gulshan-e-Iqbal, Karachi',
    }
  ];

  const createdCustomers = [];
  for (const c of customers) {
    const customer = await prisma.customer.upsert({
      where: { tenantId_code: { tenantId, code: c.code } },
      create: { tenantId, ...c },
      update: { ...c },
    });
    createdCustomers.push(customer);
  }
  console.log('✅ Customers created');

  // ---------------------------------------------------------
  // 2. Create Properties
  // ---------------------------------------------------------
  const properties = [
    {
      code: 'R-101',
      block: 'Block A',
      sizeSqYd: 120,
      type: 'RESIDENTIAL',
      status: 'SOLD',
      totalPrice: 15000000, // 1.5 Crore
      bookingPrice: 1500000,
      installmentPrice: 200000,
      isCorner: true,
      isWestOpen: true,
      isRoadFacing: true,
      isParkingFacing: false,
    },
    {
      code: 'R-102',
      block: 'Block A',
      sizeSqYd: 120,
      type: 'RESIDENTIAL',
      status: 'AVAILABLE',
      totalPrice: 14000000,
      bookingPrice: 1400000,
      installmentPrice: 200000,
      isCorner: false,
      isWestOpen: true,
      isRoadFacing: false,
      isParkingFacing: true,
    },
    {
      code: 'C-50',
      block: 'Commercial Zone',
      sizeSqYd: 200,
      type: 'COMMERCIAL',
      status: 'IN_TRANSFER',
      totalPrice: 45000000, // 4.5 Crore
      bookingPrice: 5000000,
      installmentPrice: 500000,
      isCorner: true,
      isWestOpen: false,
      isRoadFacing: true,
      isParkingFacing: true,
    }
  ];

  const createdProperties = [];
  for (const p of properties) {
    const property = await prisma.property.upsert({
      where: { tenantId_code: { tenantId, code: p.code } },
      create: { tenantId, ...p },
      update: { ...p },
    });
    createdProperties.push(property);
  }
  console.log('✅ Properties created');

  // ---------------------------------------------------------
  // 3. Create Ownerships and Installments for Sold/In Transfer
  // ---------------------------------------------------------
  
  let globalInvoiceCounter = 1;
  let globalReceiptCounter = 1;

  // Property 1: Sold to Customer 1
  const p1 = createdProperties[0]; // R-101
  const c1 = createdCustomers[0]; // Muhammad Ali
  const p1StartDate = subMonths(new Date(), 4);

  await prisma.ownership.create({
    data: {
      tenantId,
      propertyId: p1.id,
      customerId: c1.id,
      startDate: p1StartDate,
    }
  });

  const plan1 = await prisma.paymentPlan.create({
    data: {
      tenantId,
      propertyId: p1.id,
      title: 'Standard Payment Plan',
      totalAmount: p1.totalPrice!,
      currency: 'PKR',
      startDate: startOfMonth(p1StartDate),
      expectedTerms: 50, // 50 Months
    }
  });

  // Create Bookings & Installments for P1
  for (let i = 0; i <= 4; i++) {
    const dueDate = addMonths(plan1.startDate, i);
    let amount = i === 0 ? p1.bookingPrice! : p1.installmentPrice!;
    let type = i === 0 ? 'BOOKING' : 'INSTALLMENT';
    
    const installment = await prisma.planInstallment.create({
      data: {
        tenantId,
        planId: plan1.id,
        seq: i === 0 ? 0 : i,
        dueDate: dueDate,
        amount: amount,
      }
    });

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        propertyId: p1.id,
        customerId: c1.id,
        installmentId: installment.id,
        code: `INV-${globalInvoiceCounter.toString().padStart(6, '0')}`,
        type: type,
        issueDate: subMonths(dueDate, 1),
        dueDate: dueDate,
        currency: 'PKR',
        subtotal: amount,
        tax: 0,
        total: amount,
        paid: i <= 2 ? amount : 0, // First 3 paid (Booking + 2 Installments)
        status: i <= 2 ? 'PAID' : (dueDate < new Date() ? 'OVERDUE' : 'PENDING'),
      }
    });
    globalInvoiceCounter++;

    if (i <= 2) {
      await prisma.receipt.create({
        data: {
          tenantId,
          code: `RCPT-${globalReceiptCounter.toString().padStart(6, '0')}`,
          invoiceId: invoice.id,
          customerId: c1.id,
          propertyId: p1.id,
          method: 'BANK_TRANSFER',
          reference: `BT-${Math.floor(Math.random() * 1000000)}`,
          amount: amount,
          receivedAt: dueDate,
          bankName: 'Meezan Bank',
          status: 'POSTED'
        }
      });
      globalReceiptCounter++;
    }
  }

  // Property 3: In Transfer from Customer 2 to Customer 3
  const p3 = createdProperties[2]; // C-50
  const c2 = createdCustomers[1]; // Fatima Ahmed
  const p3StartDate = subMonths(new Date(), 12);

  await prisma.ownership.create({
    data: {
      tenantId,
      propertyId: p3.id,
      customerId: c2.id,
      startDate: p3StartDate,
    }
  });

  const plan3 = await prisma.paymentPlan.create({
    data: {
      tenantId,
      propertyId: p3.id,
      title: 'Commercial Plan',
      totalAmount: p3.totalPrice!,
      currency: 'PKR',
      startDate: startOfMonth(p3StartDate),
      expectedTerms: 36,
    }
  });

  const installmentAmount3 = p3.installmentPrice!;
  
  // Booking + 3 Installments for C-50
  for (let i = 0; i <= 3; i++) {
    const dueDate = addMonths(plan3.startDate, i);
    let amount = i === 0 ? p3.bookingPrice! : installmentAmount3;
    let type = i === 0 ? 'BOOKING' : 'INSTALLMENT';

    const installment = await prisma.planInstallment.create({
      data: {
        tenantId,
        planId: plan3.id,
        seq: i === 0 ? 0 : i,
        dueDate: dueDate,
        amount: amount,
      }
    });

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        propertyId: p3.id,
        customerId: c2.id,
        installmentId: installment.id,
        code: `INV-${globalInvoiceCounter.toString().padStart(6, '0')}`,
        type: type,
        issueDate: subMonths(dueDate, 1),
        dueDate: dueDate,
        currency: 'PKR',
        subtotal: amount,
        tax: 0,
        total: amount,
        paid: amount,
        status: 'PAID',
      }
    });
    globalInvoiceCounter++;

    await prisma.receipt.create({
      data: {
        tenantId,
        code: `RCPT-${globalReceiptCounter.toString().padStart(6, '0')}`,
        invoiceId: invoice.id,
        customerId: c2.id,
        propertyId: p3.id,
        method: 'CASH',
        reference: `CASH-${Math.floor(Math.random() * 10000)}`,
        amount: amount,
        receivedAt: dueDate,
        status: 'POSTED'
      }
    });
    globalReceiptCounter++;
  }

  console.log('✅ Ownerships, Payment Plans, Invoices and Receipts created');
  console.log('🎉 Seed completed successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
