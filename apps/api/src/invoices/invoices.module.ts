// src/invoices/invoices.module.ts
import { Module, forwardRef } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageModule } from '../storage/storage.module';
import { MailerModule } from '../mailer/mailer.module';
import { PdfQueueModule } from '../queue/pdf-queue.module';

@Module({
  imports: [
    StorageModule,
    MailerModule,
    PdfQueueModule,
  ],
  controllers: [InvoicesController],
  providers: [InvoicesService, PrismaService],
  exports: [InvoicesService],
})
export class InvoicesModule {}
