import { PrismaClient } from '@prisma/client';
import { DashboardService } from './dashboard/dashboard.service';

const prisma = new PrismaClient();
const service = new DashboardService(prisma as any);

async function check() {
  const summary = await service.getSummary('t_local');
  console.log('Summary:', summary);
}

check().catch(console.error).finally(() => prisma.$disconnect());
