const { PrismaClient } = require('@prisma/client');

async function main() {
  const dbUrl = 'postgresql://pms:pms@127.0.0.1:5432/pms_test?schema=public';
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

  console.log('=== STARTING PRECISION UPDATE FOR PLOT L-01 AND L-03 RECEIPTS ===\n');

  try {
    const results = await prisma.$transaction(async (tx) => {
      // 1. Verify and update Plot L-01 Receipt 3478
      const r3478 = await tx.receipt.findUnique({
        where: { id: 'cmvjfpgoh000lr8md222ala3m' },
        include: { property: { select: { code: true } } }
      });
      if (!r3478 || r3478.code !== '3478' || r3478.property?.code !== 'L-01') {
        throw new Error(`Receipt 3478 validation failed: ${JSON.stringify(r3478)}`);
      }
      console.log(`[BEFORE] L-01 Receipt 3478 date: ${r3478.receivedAt.toISOString()} | amount: ${r3478.amount}`);
      const updated3478 = await tx.receipt.update({
        where: { id: r3478.id },
        data: { receivedAt: new Date('2019-04-17T00:00:00.000Z') },
        select: { id: true, code: true, amount: true, receivedAt: true, property: { select: { code: true } } }
      });
      console.log(`[AFTER]  L-01 Receipt 3478 date: ${updated3478.receivedAt.toISOString()} | amount: ${updated3478.amount}\n`);

      // 2. Verify and update Plot L-01 Receipt 012746
      const r012746 = await tx.receipt.findUnique({
        where: { id: 'cmvjgfonf001qr8md60rleliq' },
        include: { property: { select: { code: true } } }
      });
      if (!r012746 || r012746.code !== '012746' || r012746.property?.code !== 'L-01') {
        throw new Error(`Receipt 012746 validation failed: ${JSON.stringify(r012746)}`);
      }
      console.log(`[BEFORE] L-01 Receipt 012746 date: ${r012746.receivedAt.toISOString()} | amount: ${r012746.amount}`);
      const updated012746 = await tx.receipt.update({
        where: { id: r012746.id },
        data: { receivedAt: new Date('2021-06-19T00:00:00.000Z') },
        select: { id: true, code: true, amount: true, receivedAt: true, property: { select: { code: true } } }
      });
      console.log(`[AFTER]  L-01 Receipt 012746 date: ${updated012746.receivedAt.toISOString()} | amount: ${updated012746.amount}\n`);

      // 3. Verify and update Plot L-01 Receipt 016749
      const r016749 = await tx.receipt.findUnique({
        where: { id: 'cmvjguh9g002zr8md1f4dsal1' },
        include: { property: { select: { code: true } } }
      });
      if (!r016749 || r016749.code !== '016749' || r016749.property?.code !== 'L-01') {
        throw new Error(`Receipt 016749 validation failed: ${JSON.stringify(r016749)}`);
      }
      console.log(`[BEFORE] L-01 Receipt 016749 date: ${r016749.receivedAt.toISOString()} | amount: ${r016749.amount}`);
      const updated016749 = await tx.receipt.update({
        where: { id: r016749.id },
        data: { receivedAt: new Date('2022-06-11T00:00:00.000Z') },
        select: { id: true, code: true, amount: true, receivedAt: true, property: { select: { code: true } } }
      });
      console.log(`[AFTER]  L-01 Receipt 016749 date: ${updated016749.receivedAt.toISOString()} | amount: ${updated016749.amount}\n`);

      // 4. Verify and update Plot L-03 Receipt 0154 (amount correction from 50000 to 15000)
      const r0154 = await tx.receipt.findUnique({
        where: { id: 'cmvjlb1mk0056h3bl3y5dzegw' },
        include: { property: { select: { code: true } } }
      });
      if (!r0154 || r0154.code !== '0154' || r0154.property?.code !== 'L-03') {
        throw new Error(`Receipt 0154 validation failed: ${JSON.stringify(r0154)}`);
      }
      console.log(`[BEFORE] L-03 Receipt 0154 code: ${r0154.code} | amount: ${r0154.amount} | date: ${r0154.receivedAt.toISOString()}`);
      const updated0154 = await tx.receipt.update({
        where: { id: r0154.id },
        data: { amount: 15000 },
        select: { id: true, code: true, amount: true, receivedAt: true, property: { select: { code: true } } }
      });
      console.log(`[AFTER]  L-03 Receipt 0154 code: ${updated0154.code} | amount: ${updated0154.amount} | date: ${updated0154.receivedAt.toISOString()}\n`);

      // 5. Verify and update Plot L-03 Receipt 018843 -> 018834
      const r018843 = await tx.receipt.findUnique({
        where: { id: 'cmvjlvxve006lh3bl1kz6dg67' },
        include: { property: { select: { code: true } } }
      });
      if (!r018843 || r018843.code !== '018843' || r018843.property?.code !== 'L-03') {
        throw new Error(`Receipt 018843 validation failed: ${JSON.stringify(r018843)}`);
      }
      console.log(`[BEFORE] L-03 Receipt code: ${r018843.code} | amount: ${r018843.amount} | date: ${r018843.receivedAt.toISOString()}`);
      const updated018834 = await tx.receipt.update({
        where: { id: r018843.id },
        data: { code: '018834' },
        select: { id: true, code: true, amount: true, receivedAt: true, property: { select: { code: true } } }
      });
      console.log(`[AFTER]  L-03 Receipt code: ${updated018834.code} | amount: ${updated018834.amount} | date: ${updated018834.receivedAt.toISOString()}\n`);

      return {
        updated3478,
        updated012746,
        updated016749,
        updated0154,
        updated018834
      };
    });

    console.log('=== ALL 5 RECEIPTS UPDATED AND COMMITTED SUCCESSFULLY IN TRANSACTION ===');
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('Transaction failed and rolled back:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
