import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Worker, QueueEvents } from 'bullmq';
import { redisConnection } from './redis.config';
import { PDF_QUEUE_NAME, PdfJobData, PdfJobResult } from './pdf.types';
import { PdfQueueWorker } from './pdf-queue.worker';

@Injectable()
export class PdfWorkerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PdfWorkerService.name);
  private worker!: Worker<PdfJobData, PdfJobResult>;
  private events!: QueueEvents;

  constructor(private readonly domainWorker: PdfQueueWorker) {}

  async onModuleInit() {
    const connection = redisConnection();

    this.worker = new Worker<PdfJobData, PdfJobResult>(
      PDF_QUEUE_NAME,
      async (job) => {
        return this.domainWorker.handle(job.data);
      },
      { connection, concurrency: 4 },
    );

    this.events = new QueueEvents(PDF_QUEUE_NAME, { connection });
    this.events.on('completed', ({ jobId }) =>
      this.logger.log(`PDF job completed: ${jobId}`),
    );
    this.events.on('failed', ({ jobId, failedReason }) =>
      this.logger.error(`PDF job failed: ${jobId} reason=${failedReason}`),
    );

    await this.worker.waitUntilReady();
    this.logger.log(`PDF Worker listening on queue "${PDF_QUEUE_NAME}"`);
  }

  async onModuleDestroy() {
    await Promise.all([
      this.worker?.close().catch(() => undefined),
      this.events?.close().catch(() => undefined),
    ]);
  }
}
