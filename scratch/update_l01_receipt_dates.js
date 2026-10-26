const { PrismaClient } = require('@prisma/client');

async function main() {
  const dbUrl = 'postgresql://pms:pms@127.0.0.1:5432/pms_test?schema=public';
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

  const targetUpdates = [
    {
      code: 'DEV-001491',
      id: 'cmvjha3u40046r8mdp5lck8ao',
      newDateStr: '2024-07-23T00:00:00.000Z',
      displayDate: '23/07/2024'
    },
    {
      code: 'DEV-001543',
      id: 'cmvjhblw3004cr8md3kvwjy6e',
      newDateStr: '2024-11-06T00:00:00.000Z',
      displayDate: '06/11/2024'
    },
    {
      code: 'DEV-001557',
      id: 'cmvjhdixq004fr8mdi8ijrxee',
      newDateStr: '2024-12-14T00:00:00.000Z',
      displayDate: '14/12/2024'
    },
    {
      code: 'DEV-001595',
      id: 'cmvjhf2lb004lr8mddafhhtvz',
      newDateStr: '2025-03-01T00:00:00.000Z',
      displayDate: '01/03/2025'
    }
  ];

  console.log('--- STARTING SAFE UPDATE OF L-01 DEVELOPMENT RECEIPTS ---');

  try {
    const results = await prisma.$transaction(async (tx) => {
      const updatedList = [];

      for (const item of targetUpdates) {
        // 1. Verify existence and exact match
        const existing = await tx.receipt.findUnique({
          where: { id: item.id },
          include: { property: { select: { code: true } } }
        });

        if (!existing) {
          throw new Error(`Receipt with ID ${item.id} (${item.code}) not found!`);
        }

        if (existing.code !== item.code) {
          throw new Error(`Receipt ID ${item.id} code mismatch: expected ${item.code}, got ${existing.code}`);
        }

        if (existing.property?.code !== 'L-01') {
          throw new Error(`Receipt ${item.code} does not belong to property L-01! Belongs to: ${existing.property?.code}`);
        }

        console.log(`[BEFORE] ${existing.code}: receivedAt = ${existing.receivedAt.toISOString()} -> Target = ${item.displayDate} (${item.newDateStr})`);

        // 2. Perform update
        const updated = await tx.receipt.update({
          where: { id: item.id },
          data: {
            receivedAt: new Date(item.newDateStr)
          },
          select: {
            id: true,
            code: true,
            receivedAt: true,
            amount: true,
            category: true,
            property: { select: { code: true } }
          }
        });

        updatedList.push(updated);
      }

      return updatedList;
    });

    console.log('\n--- VERIFICATION OF UPDATED RECORDS ---');
    for (const r of results) {
      console.log(`[AFTER] Code: ${r.code} | Property: ${r.property.code} | Amount: ${r.amount} | New receivedAt: ${r.receivedAt.toISOString()}`);
    }
    console.log('\nAll 4 receipts updated and verified successfully in transaction.');
  } catch (error) {
    console.error('Update failed. Transaction rolled back:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
