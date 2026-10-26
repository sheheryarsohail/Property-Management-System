import { Module } from '@nestjs/common';
import { Worker } from 'bullmq';
import { redisConnection } from './redis.config';
import { PDF_QUEUE_NAME } from './pdf.types';
import { PdfQueueWorker } from './pdf-queue.worker';

// imports for services the worker needs
import { InvoicesModule } from '../invoices/invoices.module';
import { ReceiptsModule } from '../receipts/receipts.module';
import { StatementsModule } from '../statements/statements.module';
import { IdemModule } from '../common/idem/idem.module';
import { StorageModule } from '../storage/storage.module';

export const PDF_WORKER_TOKEN = 'PDF_WORKER';

@Module({
  imports: [
    InvoicesModule,    // provides InvoicesService
    ReceiptsModule,    // provides ReceiptsService
    StatementsModule,  // provides StatementsService
    IdemModule,        // exports IdemService
    StorageModule,   // <-- this is the missing piece

  ],
  providers: [
    PdfQueueWorker,
    {
      provide: PDF_WORKER_TOKEN,
      useFactory: (svc: PdfQueueWorker) => {
        const worker = new Worker(
          PDF_QUEUE_NAME,
          async (job) => svc.handle(job.data),
          { connection: redisConnection() },
        );
        worker.on('completed', (job, res) =>
          console.log(`[pdf-worker] completed ${job.name} #${job.id}`, res),
        );
        worker.on('failed', (job, err) =>
          console.error(`[pdf-worker] failed ${job?.name} #${job?.id}:`, err?.message || err),
        );
        return worker;
      },
      inject: [PdfQueueWorker],
    },
  ],
})
export class PdfWorkerModule {}
