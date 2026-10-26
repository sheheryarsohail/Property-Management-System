// apps/api/src/queue/pdf-queue.producer.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { Queue, JobsOptions, Job } from 'bullmq';
import { createHash } from 'node:crypto';
import { redisConnection } from './redis.config';
import { PdfJobData, PdfJobResult, PDF_QUEUE_NAME } from './pdf-queue.types';

type EnqueueOpts = {
  /** Multi-tenant scope (REQUIRED for idempotent storage on the worker) */
  tenantId?: string;

  store?: boolean;
  presign?: boolean;
  email?: string | null;
  job?: JobsOptions;

  /** Idempotency-Key header value (unique per logical request) */
  idemKey?: string;

  /** Stable resource scope (e.g., "statement:PROP:2025-01-01_to_2025-02-01:pdf") */
  scope?: string;
};

function envInt(name: string, def: number) {
  const v = process.env[name];
  const n = v ? Number(v) : def;
  return Number.isFinite(n) ? n : def;
}

const DEFAULT_ATTEMPTS = envInt('PDF_JOB_ATTEMPTS', 4);
const DEFAULT_BACKOFF_MS = envInt('PDF_JOB_BACKOFF_MS', 30_000);

/** Hash helper to keep jobIds short & Redis-safe */
function sha1(input: string) {
  return createHash('sha1').update(input).digest('hex').slice(0, 16);
}

/** Build a deterministic jobId for idempotency */
function buildJobId(data: PdfJobData, opts?: EnqueueOpts): string {
  // Prefer explicit scope when provided (it should be stable for the resource)
  const base = (opts?.scope?.trim() || `${data.type}:${data.id}`).replace(/\s+/g, '');
  // Fold the Idempotency-Key into the jobId to dedupe retries of the same logical request
  if (opts?.idemKey) return `${base}:${sha1(opts.idemKey)}`;
  return base;
}

@Injectable()
export class PdfQueueProducerService implements OnModuleDestroy {
  private readonly queue = new Queue<PdfJobData, PdfJobResult>(PDF_QUEUE_NAME, {
    connection: redisConnection(),
  });

  async onModuleDestroy() {
    await this.queue.close();
  }

  /**
   * Internal enqueue with strong idempotency:
   * - Derives a stable jobId from {scope|type:id} + optional Idempotency-Key
   * - If a job with that ID already exists and isn’t failed, returns it
   */
  private async enqueueInternal(
    data: PdfJobData,
    opts?: EnqueueOpts,
  ): Promise<{ jobId: string; existing?: boolean; state?: string }> {
    // Ensure tenant is present before it reaches the worker
    const fallbackTenant = process.env.DEFAULT_TENANT_ID || 't_local';
    const withTenant: PdfJobData = {
      ...data,
      tenantId: data.tenantId ?? opts?.tenantId ?? fallbackTenant,
    };

    const jobId = buildJobId(withTenant, opts);
    const name = 'pdf.generate';

    // If a job with this ID exists and is still relevant, treat as idempotent
    const existing = await this.queue.getJob(jobId);
    if (existing) {
      const state = await existing.getState(); // waiting | active | completed | failed | delayed | ...
      if (state !== 'failed') {
        return { jobId, existing: true, state };
      }
      // If failed, we’ll enqueue a replacement below (same jobId allowed)
    }

    const defaults: JobsOptions = {
      jobId,
      attempts: DEFAULT_ATTEMPTS,
      backoff: { type: 'exponential', delay: DEFAULT_BACKOFF_MS },
      removeOnComplete: { age: 3600, count: 2000 },
      removeOnFail: { age: 86400, count: 1000 },
    };

    const job: Job<PdfJobData, PdfJobResult> = await this.queue.add(name, withTenant, {
      ...defaults,
      ...(opts?.job ?? {}),
      jobId, // never let caller override the computed id
    });

    return { jobId: job.id as string, existing: false, state: 'waiting' };
  }

  /**
   * Generic enqueue that normalizes fields and applies defaults.
   */
  async enqueue(data: PdfJobData, opts: EnqueueOpts = {}) {
    const enriched: PdfJobData = {
      ...data,
      tenantId: data.tenantId ?? opts.tenantId, // worker will still default if absent
      idemKey: data.idemKey ?? opts.idemKey ?? undefined,
      scope: data.scope ?? opts.scope ?? undefined,
      store: data.store ?? !!opts.store,
      presign: data.presign ?? !!opts.presign,
      email: data.email ?? (opts.email ?? null),
    };
    return this.enqueueInternal(enriched, opts);
  }

  async enqueueInvoice(id: string, opts: EnqueueOpts = {}) {
    return this.enqueueInternal(
      {
        type: 'invoice',
        id,
        tenantId: opts.tenantId,
        store: !!opts.store,
        presign: !!opts.presign,
        email: opts.email ?? null,
        idemKey: opts.idemKey ?? undefined,
        scope: opts.scope ?? undefined,
      },
      opts,
    );
  }

  async enqueueReceipt(id: string, opts: EnqueueOpts = {}) {
    return this.enqueueInternal(
      {
        type: 'receipt',
        id,
        tenantId: opts.tenantId,
        store: !!opts.store,
        presign: !!opts.presign,
        email: opts.email ?? null,
        idemKey: opts.idemKey ?? undefined,
        scope: opts.scope ?? undefined,
      },
      opts,
    );
  }

  async enqueueStatement(id: string, opts: EnqueueOpts = {}) {
    return this.enqueueInternal(
      {
        type: 'statement',
        id,
        tenantId: opts.tenantId,
        store: !!opts.store,
        presign: !!opts.presign,
        email: opts.email ?? null,
        idemKey: opts.idemKey ?? undefined,
        scope: opts.scope ?? undefined,
      },
      opts,
    );
  }
}
