import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenantId = 't_local';
  const targetDate = new Date('2018-09-15T00:00:00.000Z'); // 15/9/2018

  console.log('=== CHECKING PROPERTY R-520 ===');
  let prop = await prisma.property.findFirst({
    where: { tenantId, code: 'R-520' }
  });

  if (!prop) {
    console.log('Property R-520 not found. Creating property R-520...');
    prop = await prisma.property.create({
      data: {
        tenantId,
        code: 'R-520',
        title: 'Plot R-520',
        type: 'RESIDENTIAL',
        status: 'SOLD',
        sizeSqYd: 120,
        autoReceiptGeneration: true
      }
    });
    console.log('Created Property R-520:', prop.id);
  } else {
    console.log('Found Property R-520:', prop.id);
    if (prop.status !== 'SOLD') {
      await prisma.property.update({
        where: { id: prop.id },
        data: { status: 'SOLD' }
      });
      console.log('Updated Property R-520 status to SOLD');
    }
  }

  console.log('\n=== CHECKING CUSTOMER SADIA IMRAN ===');
  let cust = await prisma.customer.findFirst({
    where: {
      tenantId,
      fullName: { contains: 'Sadia', mode: 'insensitive' }
    }
  });

  if (!cust || !cust.fullName.toLowerCase().includes('imran')) {
    // Check if there is an exact customer Sadia Imran
    let sadiaImran = await prisma.customer.findFirst({
      where: { tenantId, fullName: 'Sadia Imran' }
    });

    if (!sadiaImran) {
      // Find highest customer code
      const allCusts = await prisma.customer.findMany({
        where: { tenantId },
        select: { code: true }
      });
      let maxNum = 0;
      allCusts.forEach(c => {
        const match = c.code.match(/CUST-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      });
      const nextCode = `CUST-${(maxNum + 1).toString().padStart(4, '0')}`;

      console.log(`Creating customer Sadia Imran with code ${nextCode}...`);
      cust = await prisma.customer.create({
        data: {
          tenantId,
          code: nextCode,
          fullName: 'Sadia Imran'
        }
      });
      console.log('Created Customer Sadia Imran:', cust.id);
    } else {
      cust = sadiaImran;
    }
  }

  console.log(`Using Customer: ID=${cust.id}, Code=${cust.code}, Name="${cust.fullName}"`);

  console.log('\n=== CHECKING OWNERSHIP RECORD ===');
  const existingOwnerships = await prisma.ownership.findMany({
    where: { tenantId, propertyId: prop.id }
  });

  if (existingOwnerships.length === 0) {
    console.log('Creating new ownership record with startDate 15/9/2018...');
    const newOwnership = await prisma.ownership.create({
      data: {
        tenantId,
        propertyId: prop.id,
        customerId: cust.id,
        startDate: targetDate
      }
    });
    console.log('Created Ownership record:', newOwnership.id, newOwnership.startDate.toISOString());
  } else {
    for (const own of existingOwnerships) {
      console.log(`Updating existing ownership ${own.id} startDate from ${own.startDate.toISOString()} to ${targetDate.toISOString()}...`);
      await prisma.ownership.update({
        where: { id: own.id },
        data: {
          customerId: cust.id,
          startDate: targetDate
        }
      });
    }
  }

  // Also check if any payment plan exists for R-520
  const plans = await prisma.paymentPlan.findMany({
    where: { tenantId, propertyId: prop.id }
  });

  for (const plan of plans) {
    console.log(`Updating PaymentPlan ${plan.id} startDate to ${targetDate.toISOString()}...`);
    await prisma.paymentPlan.update({
      where: { id: plan.id },
      data: { startDate: targetDate }
    });
  }

  console.log('\n=== VERIFICATION ===');
  const updatedProp = await prisma.property.findFirst({
    where: { id: prop.id },
    include: {
      ownerships: { include: { customer: true } },
      plans: true
    }
  });

  console.log(JSON.stringify(updatedProp, null, 2));
}

main().then(() => prisma.$disconnect()).catch(err => {
  console.error(err);
  prisma.$disconnect();
});
