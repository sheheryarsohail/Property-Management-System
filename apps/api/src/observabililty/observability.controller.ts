import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReceiptsService } from '../receipts/receipts.service';
import { StorageService } from '../storage/storage.service';
import { PdfQueueProducerService } from '../queue/pdf-queue.producer';

@Controller()
export class ObservabilityController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly receipts: ReceiptsService,
    private readonly storage: StorageService,
    private readonly pdfQueue: PdfQueueProducerService,
  ) {}

  @Get('live')
  live() {
    return { live: true };
  }

  @Get('ready')
  async ready() {
    // Minimal readiness checks (fast, non-throwing)
    const dbOk = await this.prisma
      .$queryRawUnsafe('SELECT 1')
      .then(() => true)
      .catch(() => false);

    const storageOk = await this.storage
      .health()
      .then?.(() => true)
      .catch?.(() => false);

    const queueOk = typeof this.pdfQueue?.enqueue === 'function';
    return { ready: dbOk && storageOk !== false && queueOk, dbOk, storageOk, queueOk };
  }

  @Get('healthz')
  async healthz() {
    const [ready, receipts] = await Promise.all([
      this.ready(),
      this.receipts.healthz(),
    ]);
    return { live: true, ...ready, receipts };
  }
}
