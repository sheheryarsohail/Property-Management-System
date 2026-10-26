import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import type { Queue, Job, JobsOptions } from 'bullmq';
import { PDF_QUEUE_TOKEN } from './pdf-queue.module';

// OPTIONAL: centralize these in ./pdf.types if you like
const STATES = ['waiting', 'active', 'completed', 'failed', 'delayed', 'paused'] as const;
type State = (typeof STATES)[number];

type ListOpts = {
  state?: string;   // waiting|active|completed|failed|delayed|paused
  name?: string;    // job name filter
  cursor?: number;  // pagination cursor (start index)
  limit?: number;   // page size
  asc?: boolean;    // order
};

@Injectable()
export class JobsService {
  constructor(
    @Inject(PDF_QUEUE_TOKEN) private readonly queue: Queue,   // 👈 inject by token
  ) {}

  // ---------- helpers ----------

  private ensureState(s?: string): State[] {
    if (!s) return [...STATES];
    const wanted = s.toLowerCase();
    if (!STATES.includes(wanted as State)) {
      throw new BadRequestException(`Invalid state "${s}". Valid: ${STATES.join('|')}`);
    }
    return [wanted as State];
  }

  private clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  async getJob(id: string): Promise<Job> {
    const job = await this.queue.getJob(id);
    if (!job) throw new NotFoundException('Job not found');
    return job;
  }

  toDTO(job: Job, state?: string) {
    return {
      id: String(job.id),
      name: job.name,
      data: job.data,
      progress: job.progress,
      attemptsMade: job.attemptsMade,
      failedReason: job.failedReason ?? null,
      stacktrace: job.stacktrace ?? [],
      state: state ?? null,
      timestamp: job.timestamp,
      processedOn: job.processedOn ?? null,
      finishedOn: job.finishedOn ?? null,
      opts: {
        attempts: job.opts.attempts ?? 0,
        delay: job.opts.delay ?? 0,
        priority: job.opts.priority ?? undefined,
        jobId: job.opts.jobId ?? undefined,
      },
    };
  }

  // ---------- actions ----------

  /** Create a small "test" job (handy locally). */
  async addTestJob(payload: any, opts?: JobsOptions) {
    // give test jobs a stable/jobId if you want dedupe
    const job = await this.queue.add('test', payload, {
      attempts: 1,
      removeOnComplete: { age: 3600, count: 1000 },
      removeOnFail: { age: 3600, count: 1000 },
      ...opts,
    });
    return job;
  }

  /** Retry a job:
   * - failed → retry()
   * - waiting/delayed → no-op (it will run)
   * - completed → re-add same payload (new job id)
   * - active/paused → not allowed now
   */
  async retryJob(id: string) {
    const job = await this.getJob(id);
    const state = await job.getState();

    if (state === 'failed') {
      await job.retry();
      const newState = await job.getState();
      return { id: String(job.id), ok: true, action: 'retried', state: newState };
    }

    if (state === 'waiting' || state === 'delayed') {
      return { id: String(job.id), ok: true, action: 'noop', state };
    }

    if (state === 'completed') {
      const name = job.name;
      const data = job.data;
      const newJob = await this.queue.add(name, data, {
        attempts: job.opts.attempts ?? 1,
        backoff: job.opts.backoff,
        removeOnComplete: job.opts.removeOnComplete,
        removeOnFail: job.opts.removeOnFail,
        priority: job.opts.priority,
        delay: job.opts.delay,
      });
      return { id: String(job.id), ok: true, action: 'requeued', newJobId: String(newJob.id) };
    }

    // active/paused cannot be retried directly
    throw new BadRequestException(`Job in state "${state}" cannot be retried now`);
  }

  /** Cancel semantics:
   * - waiting/delayed/paused → remove (won’t run)
   * - active → set cancelRequested; worker should honor
   * - completed/failed → noop
   */
  async cancelJob(id: string) {
    const job = await this.getJob(id);
    const state = await job.getState();

    if (state === 'waiting' || state === 'delayed') {
      await job.remove();
      return { id: String(job.id), ok: true, action: 'removed', prevState: state };
    }

    if (state === 'active') {
      await job.updateData({ ...job.data, cancelRequested: true });
      return { id: String(job.id), ok: true, action: 'cancelRequested', prevState: state };
    }

    return { id: String(job.id), ok: true, action: 'noop', prevState: state };
  }

  /** Hard remove a job by id. */
  async removeJob(id: string) {
    const job = await this.getJob(id);
    await job.remove();
    return { id: String(job.id), ok: true, action: 'removed' };
  }

  /** List jobs with basic filters & cursor pagination (per-state windows collapsed). */
  async list(opts: ListOpts) {
    const limit = this.clamp(opts.limit ?? 20, 1, 100);
    const start = Math.max(opts.cursor ?? 0, 0);
    const end = start + limit - 1;
    const states = this.ensureState(opts.state);
    const asc = !!opts.asc;

    const rows: { job: Job; state: string }[] = [];
    for (const s of states) {
      const jobs = await this.queue.getJobs([s as any], start, end, asc);
      for (const j of jobs) rows.push({ job: j, state: s });
    }

    const filtered = opts.name ? rows.filter(({ job }) => job.name === opts.name) : rows;
    const items = filtered.map(({ job, state }) => this.toDTO(job, state));
    const nextCursor = filtered.length < limit ? null : start + limit;

    return {
      items,
      nextCursor,
      count: items.length,
      window: { start, limit },
      states,
      asc,
    };
  }

  /** Counts by state + recent activity per state (within lookback window). */
  async summary(opts?: { recentPerState?: number; lookbackMs?: number }) {
    const recentPerState = this.clamp(opts?.recentPerState ?? 25, 1, 200);
    const lookbackMs = opts?.lookbackMs ?? 24 * 60 * 60 * 1000; // 24h
    const now = Date.now();

    const counts = await this.queue.getJobCounts(
      'waiting',
      'active',
      'completed',
      'failed',
      'delayed',
      'paused',
    );

    const order: State[] = ['completed', 'failed', 'waiting', 'active', 'delayed', 'paused'];
    const recent: Record<string, Array<{ id: string; name: string; ts: number; state: string }>> = {};

    for (const s of order) {
      const totalForState = counts[s] ?? 0;
      if (!totalForState) { recent[s] = []; continue; }

      const start = Math.max(totalForState - recentPerState, 0);
      const end = totalForState - 1;

      const jobs = await this.queue.getJobs([s as any], start, end, true);
      const arr = jobs
        .map(j => ({ id: String(j.id), name: j.name, ts: j.timestamp, state: String(s) }))
        .filter(({ ts }) => now - ts <= lookbackMs)
        .sort((a, b) => b.ts - a.ts);

      recent[s] = arr;
    }

    return {
      counts,
      recentWindowMs: lookbackMs,
      recentPerState,
      recent,
    };
  }
}
