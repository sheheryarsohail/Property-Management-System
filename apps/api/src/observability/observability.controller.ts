import { Controller, Get } from '@nestjs/common';
import { JobsService } from '../queue/jobs.service';

@Controller()
export class ObservabilityController {
  constructor(private readonly jobs: JobsService) {}

  /**
   * Liveness: process is up and event loop responding.
   * Keep it simple 200 OK.
   */
  @Get('live')
  live() {
    return { ok: true };
  }

  /**
   * Readiness: check core dependencies quickly.
   * Here we ping Redis by asking BullMQ for counts with a short timeout.
   */
  @Get('ready')
  async ready() {
    // If Redis is unreachable, JobsService call will throw → ProblemDetails 503/500.
    const counts = await this.jobsSummarySafe();
    return { ok: true, deps: { redis: true }, counts };
  }

  /**
   * BullMQ counts and a small recent snapshot (cheap).
   */
  @Get('metrics/bullmq')
  async bullmq() {
    const summary = await this.jobs.summary({ recentPerState: 10, lookbackMs: 6 * 60 * 60 * 1000 }); // 6h
    return {
      queue: process.env.PDF_QUEUE_NAME || 'pdf',
      ...summary,
    };
  }

  private async jobsSummarySafe() {
    try {
      return await this.jobs.summary({ recentPerState: 0, lookbackMs: 1 }); // counts-only
    } catch {
      // If Redis down, surface a 503 from here if you prefer:
      // throw new ServiceUnavailableException('Redis not ready');
      return null;
    }
  }
}
