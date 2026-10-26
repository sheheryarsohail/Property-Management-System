import { Injectable } from '@nestjs/common';
import { Queue, Job } from 'bullmq';
import { redisConnection } from './redis.config';
import { PdfJobData, PdfJobResult } from '../queue/pdf.types';

@Injectable()
export class PdfQueueAdminService {
  private readonly queue = new Queue<PdfJobData, PdfJobResult>('pdf', {
    connection: redisConnection(),
  });

  async getJob(id: string) {
    const job = await Job.fromId<PdfJobData, PdfJobResult>(this.queue, id);
    if (!job) return null;

    // BullMQ: logs are fetched from the queue, not from job.getLogs()
    const [state, jobLogs] = await Promise.all([
      job.getState(),
      this.queue.getJobLogs(job.id as string), // returns { logs: string[], count: number }
    ]);

    return {
      id: job.id,
      name: job.name,
      state,
      data: job.data,
      attemptsMade: job.attemptsMade,
      progress: job.progress,
      returnvalue: job.returnvalue ?? null,
      failedReason: job.failedReason ?? null,
      stacktrace: job.stacktrace ?? [],
      timestamp: job.timestamp ?? null,
      processedOn: job.processedOn ?? null,
      finishedOn: job.finishedOn ?? null,
      logs: jobLogs?.logs ?? [],
      logsCount: jobLogs?.count ?? 0,
    };
  }

  async health() {
    const counts = await this.queue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused'
    );
    return { ok: true, counts };
  }
}
