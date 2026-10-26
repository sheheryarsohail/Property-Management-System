const { PrismaClient } = require('/home/sheheryar-sohail/Downloads/Property-Management-System-main/apps/api/node_modules/@prisma/client');

async function inspectDb(name, url) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    const total = await prisma.customer.count();
    const withPhoneOnly = await prisma.customer.count({
      where: {
        AND: [
          { phone: { not: null } },
          { phone: { not: '' } },
          { OR: [{ mobile: null }, { mobile: '' }] }
        ]
      }
    });
    const withMobileOnly = await prisma.customer.count({
      where: {
        AND: [
          { mobile: { not: null } },
          { mobile: { not: '' } },
          { OR: [{ phone: null }, { phone: '' }] }
        ]
      }
    });
    const withBoth = await prisma.customer.count({
      where: {
        AND: [
          { phone: { not: null } },
          { phone: { not: '' } },
          { mobile: { not: null } },
          { mobile: { not: '' } }
        ]
      }
    });
    const withNeither = await prisma.customer.count({
      where: {
        AND: [
          { OR: [{ phone: null }, { phone: '' }] },
          { OR: [{ mobile: null }, { mobile: '' }] }
        ]
      }
    });

    console.log(`\n=== Database: ${name} ===`);
    console.log(`Total Customers: ${total}`);
    console.log(`With Phone only: ${withPhoneOnly}`);
    console.log(`With Mobile only: ${withMobileOnly}`);
    console.log(`With Both: ${withBoth}`);
    console.log(`With Neither: ${withNeither}`);

    const samples = await prisma.customer.findMany({
      where: {
        OR: [
          { mobile: { not: null } },
          { phone: { not: null } }
        ]
      },
      select: { code: true, fullName: true, phone: true, mobile: true },
      take: 10
    });
    console.log('\nSample Customers:');
    console.table(samples);
  } finally {
    await prisma.$disconnect();
  }
}

async function run() {
  await inspectDb('pms (Main)', 'postgresql://pms:pms@127.0.0.1:5432/pms?schema=public');
  await inspectDb('pms_test (Test)', 'postgresql://pms:pms@127.0.0.1:5432/pms_test?schema=public');
}

run().catch(console.error);
