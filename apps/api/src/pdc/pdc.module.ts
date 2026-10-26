import { Module } from '@nestjs/common';
import { PdcService } from './pdc.service';
import { PdcController } from './pdc.controller';
import { PaymentPlansModule } from '../payment-plans/payment-plans.module';

@Module({
  imports: [PaymentPlansModule],
  providers: [PdcService],
  controllers: [PdcController],
})
export class PdcModule {}
