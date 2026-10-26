import { Module } from '@nestjs/common';
import { PaymentPlansController } from './payment-plans.controller';
import { PaymentPlansService } from './payment-plans.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PaymentPlansController],
  providers: [PaymentPlansService],
  exports: [PaymentPlansService],
})
export class PaymentPlansModule {}
