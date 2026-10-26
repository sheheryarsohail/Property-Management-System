import { Queue, Worker, QueueEvents } from 'bullmq';
import { queueOpts } from './connection';
import { ENV } from '../env';
import { log } from '../logger';
import { PDF_QUEUE_NAME, PDF_JOB_NAME } from './types';
import { handlePdfJob } from './pdf.processor';

export function registerQueues() {
  const pdfQueue = new Queue(PDF_QUEUE_NAME, queueOpts);
  const pdfEvents = new QueueEvents(PDF_QUEUE_NAME, queueOpts);

  const pdfWorker = new Worker(
    PDF_QUEUE_NAME,
    async (job) => {
      if (job.name !== PDF_JOB_NAME) throw new Error(`Unknown job: ${job.name}`);
      return handlePdfJob(job as any);
    },
    { ...queueOpts, concurrency: ENV.CONCURRENCY_PDF }
  );

  pdfWorker.on('completed', (job, result) => log.info({ jobId: job.id, result }, 'pdf completed'));
  pdfWorker.on('failed', (job, err) => log.error({ jobId: job?.id, err }, 'pdf failed'));
  pdfEvents.on('waiting', ({ jobId }) => log.debug({ jobId }, 'pdf waiting'));

  const cleanup = async () => {
    log.info('worker shutting down…');
    await Promise.allSettled([pdfWorker.close(), pdfEvents.close(), pdfQueue.close()]);
    process.exit(0);
  };
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  return { pdfQueue, pdfWorker, pdfEvents };
}
