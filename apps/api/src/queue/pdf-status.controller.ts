import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { Queue } from 'bullmq';
import { redisConnection } from './redis.config';
import { PDF_QUEUE_NAME } from './pdf.types';

@Controller('queues/pdf')
export class PdfStatusController {
  private readonly queue = new Queue(PDF_QUEUE_NAME, { connection: redisConnection() });

  @Get(':jobId')
  async getStatus(@Param('jobId') jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);

    const state = await job.getState(); // waiting | active | completed | failed | delayed | paused
    const progress = job.progress ?? 0;
    const attemptsMade = job.attemptsMade ?? 0;

    // Only fetch result/error for terminal states
    let result: unknown = undefined;
    let failedReason: string | undefined;

    if (state === 'completed') {
      result = await job.returnvalue(); // PdfJobResult from worker
    } else if (state === 'failed') {
      failedReason = job.failedReason;
    }

    return {
      id: job.id,
      name: job.name,
      state,
      progress,
      attemptsMade,
      failedReason,
      result,
      timestamp: {
        added: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      },
    };
  }
}
