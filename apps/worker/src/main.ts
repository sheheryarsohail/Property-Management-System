import 'dotenv/config';
import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { pdfProcessor } from './processors/pdf.processor';
import { log } from './logger';

const queueName = process.env.PDF_QUEUE_NAME ?? 'pdf';

// Build a Redis connection that satisfies BullMQ’s requirements
const redisUrl = process.env.REDIS_URL ?? 'redis://redis:6379';
const connection = new IORedis(redisUrl, {
  // Required by BullMQ when using blocking commands:
  maxRetriesPerRequest: null,
  // Helpful in containers/k8s:
  enableReadyCheck: false,
});

const concurrency = Number(process.env.WORKER_CONCURRENCY ?? 1);

const worker = new Worker(queueName, pdfProcessor, {
  connection,
  concurrency,
});

worker.on('ready', () => log.info({ queueName }, 'worker ready'));
worker.on('completed', (job) => log.info({ id: job.id }, 'job completed'));
worker.on('failed', (job, err) => log.error({ id: job?.id, err }, 'job failed'));
worker.on('error', (err) => log.error({ err }, 'worker error'));

const shutdown = async (signal: NodeJS.Signals) => {
  log.info({ signal }, 'shutting down worker');
  try {
    await worker.close();
  } catch (err) {
    log.error({ err }, 'error closing worker');
  } finally {
    try {
      await connection.quit();
    } catch {
      // ignore
    }
    process.exit(0);
  }
};

process.once('SIGTERM', () => shutdown('SIGTERM'));
process.once('SIGINT', () => shutdown('SIGINT'));
