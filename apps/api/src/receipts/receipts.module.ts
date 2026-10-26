// src/receipts/receipts.module.ts
import { Module } from '@nestjs/common';
import { ReceiptsService } from './receipts.service';
import { ReceiptsController } from './receipts.controller';
import { PrismaService } from '../prisma/prisma.service';
import { StorageModule } from '../storage/storage.module';
import { MailerModule } from '../mailer/mailer.module';
import { PdfQueueModule } from '../queue/pdf-queue.module';
import { IdemModule } from '../common/idem/idem.module';
import { PaymentPlansModule } from '../payment-plans/payment-plans.module';

@Module({
  imports: [StorageModule, MailerModule, PdfQueueModule, IdemModule, PaymentPlansModule],
  controllers: [ReceiptsController],
  providers: [ReceiptsService, PrismaService],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}
