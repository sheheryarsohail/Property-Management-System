import type { Job } from 'bullmq';
import { log } from '../logger';
import type { PdfJobData, PdfJobResult } from './types';

// TODO replace with your real implementations:
async function renderAndUploadInvoice(id: string, data: PdfJobData) {
  await new Promise(r => setTimeout(r, 200)); // simulate
  const key = `invoices/${id}/${Date.now()}.pdf`;
  const url = data.presign ? `https://minio.local/presign/${key}` : `https://minio.local/${key}`;
  return { url, key, bytes: 123456 };
}
async function renderAndUploadReceipt(id: string, data: PdfJobData) {
  await new Promise(r => setTimeout(r, 200));
  const key = `receipts/${id}/${Date.now()}.pdf`;
  const url = data.presign ? `https://minio.local/presign/${key}` : `https://minio.local/${key}`;
  return { url, key, bytes: 654321 };
}
async function renderAndUploadStatement(id: string, data: PdfJobData) {
  await new Promise(r => setTimeout(r, 200));
  const key = `statements/${id}/${Date.now()}.pdf`;
  const url = data.presign ? `https://minio.local/presign/${key}` : `https://minio.local/${key}`;
  return { url, key, bytes: 222222 };
}

export async function handlePdfJob(job: Job<PdfJobData, PdfJobResult>) {
  const started = Date.now();
  const { id, data } = job;

  log.info({ jobId: id, data }, 'pdf job started');

  if (!data?.type || !data?.id) {
    throw new Error('Invalid job: missing type or id');
  }

  let out: { url: string; key: string; bytes: number };

  switch (data.type) {
    case 'invoice':
      out = await renderAndUploadInvoice(data.id, data);
      break;
    case 'receipt':
      out = await renderAndUploadReceipt(data.id, data);
      break;
    case 'statement':
      out = await renderAndUploadStatement(data.id, data);
      break;
    default:
      throw new Error(`Unsupported pdf type: ${(data as any).type}`);
  }

  const ms = Date.now() - started;
  log.info({ jobId: id, key: out.key, size: out.bytes, ms }, 'pdf job done');

  const result: PdfJobResult = {
    ok: true,
    url: out.url,
    key: out.key,
    size: out.bytes,
    docType: data.type,
    entityId: data.id,
    processedAt: new Date().toISOString(),
  };
  return result;
}
