import { Job } from 'bullmq';
import { log } from '../logger';

export async function pdfProcessor(job: Job) {
  log.info({ id: job.id, name: job.name, data: job.data }, 'processing PDF job');
  // TODO: real work here
  return { ok: true };
}
