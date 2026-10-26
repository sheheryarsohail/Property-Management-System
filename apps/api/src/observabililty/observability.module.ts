// apps/api/src/observability/observability.module.ts
import { Module } from '@nestjs/common';
import { ObservabilityController } from './observability.controller';
import { PrismaService } from '../prisma/prisma.service';
import { HealthzController } from './healthz.controller';

@Module({
  controllers: [ObservabilityController, HealthzController],
  providers: [PrismaService],
})
export class ObservabilityModule {}
