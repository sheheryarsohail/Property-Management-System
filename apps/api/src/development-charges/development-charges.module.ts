import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DevelopmentChargesController } from './development-charges.controller';
import { DevelopmentChargesService } from './development-charges.service';

@Module({
  imports: [PrismaModule],
  controllers: [DevelopmentChargesController],
  providers: [DevelopmentChargesService],
  exports: [DevelopmentChargesService],
})
export class DevelopmentChargesModule {}
