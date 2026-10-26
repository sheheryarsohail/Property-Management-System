import { Module } from '@nestjs/common';
import { OwnershipsService } from './ownerships.service';
import { OwnershipsController } from './ownerships.controller';
import { PaymentPlansModule } from '../payment-plans/payment-plans.module';

@Module({
  imports: [PaymentPlansModule],
  providers: [OwnershipsService],
  controllers: [OwnershipsController]
})
export class OwnershipsModule {}
