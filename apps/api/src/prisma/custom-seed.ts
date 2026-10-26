import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing all data...');
  // Delete all tenants, which will cascade and delete everything else
  await prisma.tenant.deleteMany({});
  
  const tenantId = 't_local';

  // Make sure tenant exists
  await prisma.tenant.create({
    data: { id: tenantId, name: 'Local Dev Tenant' }
  });

  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.create({
    data: { email: 'admin@local.dev', name: 'Local Admin', role: 'ADMIN', tenantId, password: hashedPassword }
  });

  // ---------------------------------------------------------
  // 1. Create Customers (10 Customers)
  // ---------------------------------------------------------
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
    const customer = await prisma.customer.create({
      data: { tenantId, ...c }
    });
    createdCustomers.push(customer);
  }
  console.log('✅ 10 Customers created');

  // ---------------------------------------------------------
  // 2. Create 20 Properties
  // ---------------------------------------------------------
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
      installmentPrice: 100000 + (i * 1000),
      isCorner: i % 3 === 0,
      isWestOpen: i % 2 === 0,
      isRoadFacing: true,
      isParkingFacing: false,
      autoReceiptGeneration: false, // Ensure no receipt is auto generated
    });
  }

  const createdProperties = [];
  for (const p of properties) {
    const property = await prisma.property.create({
      data: { tenantId, ...p }
    });
    createdProperties.push(property);
  }
  console.log('✅ 20 Properties created');

  // ---------------------------------------------------------
  // 3. Create Ownerships for 10 Properties
  // ---------------------------------------------------------
  
  // assign date should be 2018 and onwards (let's use 2018-01-01)
  const assignDate = new Date('2018-01-01T00:00:00Z');

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

    // The prompt says "dont create any receipt". So we only create Ownership and no Receipts.
  }

  console.log('✅ 10 Properties assigned (Ownerships created with date 2018 onwards, no receipts)');
  console.log('🎉 Custom Seed completed successfully!');
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
