import { Global, Module } from '@nestjs/common';
import { Queue } from 'bullmq';
import { redisConnection } from './redis.config';
import { PDF_QUEUE_NAME } from './pdf.types';
import { PdfQueueProducerService } from './pdf-queue.producer';

export const PDF_QUEUE_TOKEN = 'PDF_QUEUE';

@Global()
@Module({
  providers: [
    {
      provide: PDF_QUEUE_TOKEN,
      useFactory: () =>
        new Queue(PDF_QUEUE_NAME, {
          connection: redisConnection(),
        }),
    },
    PdfQueueProducerService,
  ],
  exports: [PDF_QUEUE_TOKEN, PdfQueueProducerService],
})
export class PdfQueueModule {}
