import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenantId = 't_local';

  // Make sure tenant exists
  await prisma.tenant.upsert({
    where: { id: tenantId },
    create: { id: tenantId, name: 'Local Dev Tenant' },
    update: {},
  });

  const bcrypt = require('bcrypt');
  const hashedPassword = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@local.dev' },
    create: {
      email: 'admin@local.dev',
      name: 'Local Admin',
      role: 'ADMIN',
      tenantId,
      password: hashedPassword,
    },
    update: { password: hashedPassword },
  });

  console.log('✅ Tenant and Admin User created. No sample data seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

