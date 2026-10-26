// src/queue/pdf-queue.service.ts
import { Injectable } from '@nestjs/common';
import { Queue, JobsOptions } from 'bullmq';
import { randomUUID } from 'node:crypto';
import { redisConnection } from './redis.config';
import { PdfJobData, PdfJobResult } from './pdf.types';

type EnqueueOpts = { store?: boolean; presign?: boolean; email?: string | null; jobId?: string };

@Injectable()
export class PdfQueueService {
  private readonly queue = new Queue<PdfJobData, PdfJobResult>('pdf', {
    connection: redisConnection(),
  });

  // --- NEW: convenience wrappers so call sites like enqueueInvoice(...) work ---
  async enqueueInvoice(inv: string | { id: string }, opts?: EnqueueOpts) {
    const id = this.coerceId(inv);
    return this.enqueue({ type: 'invoice', id, store: opts?.store, presign: opts?.presign, email: opts?.email ?? null }, { jobId: opts?.jobId });
  }
  async enqueueReceipt(rcp: string | { id: string }, opts?: EnqueueOpts) {
    const id = this.coerceId(rcp);
    return this.enqueue({ type: 'receipt', id, store: opts?.store, presign: opts?.presign, email: opts?.email ?? null }, { jobId: opts?.jobId });
  }
  async enqueueStatement(st: string | { id: string }, opts?: EnqueueOpts) {
    const id = this.coerceId(st);
    return this.enqueue({ type: 'statement', id, store: opts?.store, presign: opts?.presign, email: opts?.email ?? null }, { jobId: opts?.jobId });
  }
  // ---------------------------------------------------------------------------

  async enqueue(data: PdfJobData, opts?: { jobId?: string }) {
    const baseId = opts?.jobId ?? this.defaultJobId(data);
    const jobId = `${baseId}:${Date.now()}:${randomUUID().slice(0, 8)}`;

    const jobsOptions: JobsOptions = {
      jobId,
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 1000,
      removeOnFail: 1000,
    };

    const job = await this.queue.add(data.type, data, jobsOptions);
    return { jobId: job.id };
  }

  private defaultJobId(d: PdfJobData) {
    const flags = `${d.store ? 1 : 0}${d.presign ? 1 : 0}${d.email ? 1 : 0}`;
    return `${d.type}:${d.id}:${flags}`;
  }

  private coerceId(objOrId: string | { id: string }): string {
    if (typeof objOrId === 'string') return objOrId;
    if (objOrId && typeof objOrId === 'object' && typeof objOrId.id === 'string') return objOrId.id;
    throw new Error('Invalid id passed to PdfQueueService');
  }
}
